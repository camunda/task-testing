/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * @import {Injector} from 'didi';
 *
 * @import {
 *   CreateProcessInstanceResult,
 *   DeploymentResult,
 *   Element,
 *   ElementInstanceResult,
 *   IncidentResult,
 *   ProcessInstanceResult,
 *   ElementInstanceSearchQueryResult,
 *   IncidentSearchQueryResult,
 *   ProcessInstanceSearchQueryResult,
 *   TaskExecutionApi,
 *   TaskExecutionError,
 *   TaskExecutionErrorResult,
 *   TaskExecutionFinishedResult,
 *   TaskExecutionPolledResult,
 *   TaskExecutionState,
 *   TaskExecutionUserCancelResult,
 *   TaskExecutionUserSelectionChangedResult
 * } from './types';
 */

import EventEmitter from 'events';
import { getProcessId } from './utils/element';

export const POLL_INTERVAL_MS = 1000;

/**
 * Create a TaskExecutionError from a contextual message and a failed API
 * response. Extracts error metadata (errorType, status, detail, operationId)
 * from the response when available.
 *
 * @param {string} message
 * @param {{ error?: string, errorType?: string, status?: number|null, detail?: string|null, operationId?: string|null }} [failedResponse]
 *
 * @returns {TaskExecutionError}
 */
function toTaskExecutionError(message, failedResponse) {
  return {
    message,
    response: failedResponse?.error,
    errorType: failedResponse?.errorType,
    status: failedResponse?.status,
    detail: failedResponse?.detail,
    operationId: failedResponse?.operationId
  };
}

/**
 * Task execution states.
 */
export const TASK_EXECUTION_STATE = /** @type {const} */ ({
  IDLE: 'idle',
  DEPLOYING: 'deploying',
  STARTING_INSTANCE: 'starting-instance',
  EXECUTING: 'executing'
});

/**
 * Task execution finished reasons.
 */
export const TASK_EXECUTION_FINISHED_REASON = /** @type {const} */ ({
  ERROR: 'error',
  INCIDENT: 'incident',
  TERMINATED: 'terminated',
  USER_CANCEL: 'user.cancel',
  USER_SELECTION_CHANGED: 'user.selectionChanged'
});

/**
 * Process instance states.
 */
export const PROCESS_INSTANCE_STATE = /** @type {const} */ ({
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  TERMINATED: 'TERMINATED'
});

/**
 * Element instance states.
 */
export const ELEMENT_INSTANCE_STATE = /** @type {const} */ ({
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  TERMINATED: 'TERMINATED'
});

/**
 * Task execution events.
 */
export const TASK_EXECUTION_EVENT = /** @type {const} */ ({
  STATE_CHANGED: 'taskExecution.state.changed',
  DEPLOYED: 'taskExecution.deployed',
  INSTANCE_STARTED: 'taskExecution.instanceStarted',
  POLLED: 'taskExecution.polled',
  FINISHED: 'taskExecution.finished'
});

/**
 * Deploys a process, starts an instance, and polls for completion every second.
 * Each call to {@link executeTask} assigns a unique execution ID; in-flight
 * responses from a superseded or canceled execution are silently discarded.
 *
 * Cancellation {@link cancelTaskExecution} (user-initiated, selection change, or error) clears the interval,
 * invalidates the execution ID, and emits a finished event. Process instances
 * are not automatically terminated on cancellation.
 *
 * @emits `taskExecution.state.changed` with payload of type {@link TaskExecutionState}
 * @emits `taskExecution.deployed` with payload of type {@link DeploymentResult}
 * @emits `taskExecution.instanceStarted` with payload of type {@link CreateProcessInstanceResult}
 * @emits `taskExecution.polled` with payload of type {@link TaskExecutionPolledResult}
 * @emits `taskExecution.finished` with payload of type {@link TaskExecutionFinishedResult}
 */
export default class TaskExecution extends EventEmitter {

  /**
   * @param {Injector} injector
   * @param {TaskExecutionApi} api
   */
  constructor(injector, api) {
    super();

    /** @type {TaskExecutionApi} */
    this._api = api;

    this._interval = null;

    /** @type {Symbol|null} */
    this._executionId = null;

    /** @type {typeof TASK_EXECUTION_STATE[keyof typeof TASK_EXECUTION_STATE]} */
    this._state = TASK_EXECUTION_STATE.IDLE;

    /** @type {TaskExecutionPolledResult|null} */
    this._lastPolledResult = null;

    const eventBus = injector.get('eventBus');

    eventBus.on('selection.changed', () => {
      this._cancelTaskExecution(TASK_EXECUTION_FINISHED_REASON.USER_SELECTION_CHANGED);
    });
  }

  /**
   * Start task execution. If an execution is already in progress, its
   * in-flight responses will be silently discarded.
   *
   * @param {Element} element
   * @param {Object} variables
   *
   * @returns {Promise<void>}
   */
  async executeTask(element, variables) {
    const processId = getProcessId(element);

    if (!processId) {
      return;
    }

    this._lastPolledResult = null;

    const executionId = Symbol();
    this._executionId = executionId;

    this._changeState(TASK_EXECUTION_STATE.DEPLOYING);

    const deploymentResponse = await this._api.deploy();

    if (this._executionId !== executionId) {
      return;
    }

    if (!deploymentResponse.success) {
      const error = toTaskExecutionError('Failed to deploy process definition', deploymentResponse);

      this._cancelTaskExecution(TASK_EXECUTION_FINISHED_REASON.ERROR, error);

      return;
    }

    const processDefinitionKey = getProcessDefinitionKey(deploymentResponse.response, processId);

    if (!processDefinitionKey) {
      const error = toTaskExecutionError('Failed to retrieve process definition key from deployment response');

      this._cancelTaskExecution(TASK_EXECUTION_FINISHED_REASON.ERROR, error);

      return;
    }

    this.emit(TASK_EXECUTION_EVENT.DEPLOYED, deploymentResponse);

    this._changeState(TASK_EXECUTION_STATE.STARTING_INSTANCE);

    const startInstanceResponse = await this._api.startInstance(processDefinitionKey, element.id, variables);

    if (this._executionId !== executionId) {
      return;
    }

    if (!startInstanceResponse.success) {
      const error = toTaskExecutionError('Failed to start process instance', startInstanceResponse);

      this._cancelTaskExecution(TASK_EXECUTION_FINISHED_REASON.ERROR, error);

      return;
    }

    const processInstanceKey = getProcessInstanceKey(startInstanceResponse.response);

    if (!processInstanceKey) {
      const error = toTaskExecutionError('Failed to retrieve process instance key from start instance response');

      this._cancelTaskExecution(TASK_EXECUTION_FINISHED_REASON.ERROR, error);

      return;
    }

    this.emit(TASK_EXECUTION_EVENT.INSTANCE_STARTED, startInstanceResponse);

    this._changeState(TASK_EXECUTION_STATE.EXECUTING);

    const intervalCallback = async () => {
      const processInstanceResponse = await this._api.getProcessInstance(processInstanceKey);

      if (this._executionId !== executionId) {
        return;
      }

      if (!processInstanceResponse.success) {
        this._cancelTaskExecution(TASK_EXECUTION_FINISHED_REASON.ERROR,
          toTaskExecutionError('Failed to get process instance', processInstanceResponse)
        );

        return;
      }

      const processInstance = getProcessInstance(processInstanceResponse.response, processInstanceKey);

      if (!processInstance) {

        // No process instance found, try again
        return;
      }

      const responses = await Promise.all([
        this._api.getChildProcessInstances(processInstanceKey),
        this._api.getProcessInstanceElementInstances(processInstanceKey),
        this._api.getProcessInstanceJobs(processInstanceKey),
        this._api.getProcessInstanceMessageSubscriptions(processInstanceKey),
        this._api.getProcessInstanceUserTasks(processInstanceKey),
        this._api.getProcessInstanceVariables(processInstanceKey)
      ]);

      if (this._executionId !== executionId) {
        return;
      }

      const errorResult = responses.find(result => !result.success);

      if (errorResult) {
        this._cancelTaskExecution(TASK_EXECUTION_FINISHED_REASON.ERROR,
          toTaskExecutionError('Failed to poll process instance data', errorResult)
        );

        return;
      }

      const [
        childProcessInstancesResponse,
        elementInstancesResponse,
        jobsResponse,
        messageSubscriptionsResponse,
        userTasksResponse,
        variablesResponse
      ] = responses;

      /** @type {TaskExecutionPolledResult} */
      const polledResult = {
        elementId: element.id,
        processInstanceKey,
        childProcessInstancesResponse,
        elementInstancesResponse,
        jobsResponse,
        messageSubscriptionsResponse,
        processInstanceResponse,
        userTasksResponse,
        variablesResponse
      };

      this._lastPolledResult = polledResult;

      this.emit(TASK_EXECUTION_EVENT.POLLED, polledResult);

      const hasIncident = hasProcessInstanceIncident(processInstanceResponse.response, processInstanceKey);

      if (hasIncident) {
        const getProcessInstanceIncidentResult = await this._api.getProcessInstanceIncident(processInstanceKey);

        if (this._executionId !== executionId) {
          return;
        }

        if (!getProcessInstanceIncidentResult.success) {
          this._cancelTaskExecution(TASK_EXECUTION_FINISHED_REASON.ERROR,
            toTaskExecutionError('Failed to get process instance incident', getProcessInstanceIncidentResult)
          );

          return;
        }

        const incident = getIncident(getProcessInstanceIncidentResult.response);

        this.emit(TASK_EXECUTION_EVENT.FINISHED, /** @type {TaskExecutionFinishedResult} */ ({
          incident,
          lastPolledResult: this._lastPolledResult,
          processInstanceKey,
          reason: TASK_EXECUTION_FINISHED_REASON.INCIDENT,
          success: false
        }));

        this._cancelTaskExecution();

        return;
      }

      const state = getProcessInstanceState(processInstanceResponse.response, processInstanceKey);

      // Process instance can be completed if task has no outgoing sequence flows
      const isCompleted = state === PROCESS_INSTANCE_STATE.COMPLETED;

      // Process instance is terminated when task executed sucessfully or was
      // terminated through different means (e.g. non-interrupting boundary
      // event leading to terminate end event)
      const isTerminated = state === PROCESS_INSTANCE_STATE.TERMINATED;

      if (isCompleted || isTerminated) {

        // Find element instance of tested element and check if it is completed
        // or terminated to determine test success
        const elementInstance = elementInstancesResponse.success ? getElementInstance(elementInstancesResponse.response, element) : null;

        const isSuccess = elementInstance && elementInstance.state === ELEMENT_INSTANCE_STATE.COMPLETED;

        if (isSuccess) {
          this.emit(TASK_EXECUTION_EVENT.FINISHED, /** @type {TaskExecutionFinishedResult} */ ({
            lastPolledResult: this._lastPolledResult,
            processInstanceKey,
            success: true
          }));
        } else {
          this.emit(TASK_EXECUTION_EVENT.FINISHED, /** @type {TaskExecutionFinishedResult} */ ({
            lastPolledResult: this._lastPolledResult,
            processInstanceKey,
            reason: TASK_EXECUTION_FINISHED_REASON.TERMINATED,
            success: false
          }));
        }

        this._cancelTaskExecution();
      }
    };

    this._interval = setInterval(intervalCallback, POLL_INTERVAL_MS);
  }

  /**
   * Cancel current task execution with user cancellation reason.
   */
  async cancelTaskExecution() {
    this._cancelTaskExecution(TASK_EXECUTION_FINISHED_REASON.USER_CANCEL);
  }

  /**
   * Cancel current task execution, invalidate the execution ID, and
   * transition to idle. No-op when already idle. If a reason is provided,
   * emits a `taskExecution.finished` event with the corresponding result.
   *
   * @param {typeof TASK_EXECUTION_FINISHED_REASON[keyof typeof TASK_EXECUTION_FINISHED_REASON]} [reason]
   * @param {TaskExecutionError} [error]
   */
  _cancelTaskExecution(reason, error) {
    if (this._isIdle()) {
      return;
    }

    if (this._interval) {
      clearInterval(this._interval);
    }

    this._executionId = null;

    this._changeState(TASK_EXECUTION_STATE.IDLE);

    if (reason) {

      /** @type {TaskExecutionFinishedResult} */
      const result = reason === TASK_EXECUTION_FINISHED_REASON.ERROR
        ? /** @type {TaskExecutionErrorResult} */ ({
          success: false,
          reason,
          error,
          processInstanceKey: this._lastPolledResult?.processInstanceKey ?? null,
          lastPolledResult: this._lastPolledResult
        })
        : /** @type {TaskExecutionUserCancelResult | TaskExecutionUserSelectionChangedResult} */ ({
          success: false,
          reason,
          processInstanceKey: this._lastPolledResult?.processInstanceKey ?? null,
          lastPolledResult: this._lastPolledResult
        });

      this.emit(TASK_EXECUTION_EVENT.FINISHED, result);
    }

    this._lastPolledResult = null;
  }

  /**
   * Change execution state and emit event.
   *
   * @param {typeof TASK_EXECUTION_STATE[keyof typeof TASK_EXECUTION_STATE]} state - New state
   */
  _changeState(state) {
    if (this._state === state) {
      return;
    }

    this._state = state;

    this.emit(TASK_EXECUTION_EVENT.STATE_CHANGED, state);
  }

  _isIdle() {
    return this._state === TASK_EXECUTION_STATE.IDLE;
  }
}

/**
 * Get the process instance key from the response.
 *
 * @param {CreateProcessInstanceResult} response
 *
 * @returns {string | null} The process instance key or null if not found.
 */
function getProcessInstanceKey(response) {
  const { processInstanceKey } = response;

  return processInstanceKey || null;
}

/**
 * @param {ProcessInstanceSearchQueryResult} response
 * @param {string} processInstanceKey
 *
 * @returns {ProcessInstanceResult | null}
 */
function getProcessInstance(response, processInstanceKey) {
  const { items = [] } = response;

  if (!items.length) {
    return null;
  }

  return items.find(item => item.processInstanceKey === processInstanceKey) || null;
}

/**
 * @param {ProcessInstanceSearchQueryResult} response
 * @param {string} processInstanceKey
 *
 * @returns {string | null}
 */
function getProcessInstanceState(response, processInstanceKey) {
  const processInstance = getProcessInstance(response, processInstanceKey);

  if (!processInstance) {
    return null;
  }

  return processInstance.state;
}

/**
 * @param {ProcessInstanceSearchQueryResult} response
 * @param {string} processInstanceKey
 *
 * @returns {boolean}
 */
function hasProcessInstanceIncident(response, processInstanceKey) {
  const processInstance = getProcessInstance(response, processInstanceKey);

  if (!processInstance) {
    return false;
  }

  return processInstance.hasIncident || false;
}

/**
 * Get the incident details from the response.
 *
 * @param {IncidentSearchQueryResult} response
 *
 * @returns {IncidentResult|null}
 */
export function getIncident(response) {
  const { items = [] } = response;

  if (!items.length) {
    return null;
  }

  return items[0];
}

/**
 * Get the process definition key from the deployment response.
 *
 * @param {DeploymentResult} deployResponse
 * @param {string} processId
 *
 * @returns {string|null} The process definition key or null if not found.
 */
export function getProcessDefinitionKey(deployResponse, processId) {
  const { deployments = [] } = deployResponse;

  for (const deployment of deployments) {
    if (deployment.processDefinition) {
      const { processDefinition } = deployment;

      if (processDefinition.processDefinitionId === processId) {
        return processDefinition.processDefinitionKey;
      }
    }
  }

  return null;
}

/**
 * Get the element instance of the given element from the response.
 *
 * @param {ElementInstanceSearchQueryResult} response
 * @param {Element} element
 *
 * @returns {ElementInstanceResult|null} The element instance or null if not found.
 */
export function getElementInstance(response, element) {
  const { items = [] } = response;

  return items.find(item => item.elementId === element.id) || null;
}