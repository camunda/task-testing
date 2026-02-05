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
 * @import {
 *   TaskExecutionApi,
 *   TaskExecutionResult,
 *   TaskExecutionError,
 *   TaskExecutionStatus
 * } from './types';
 */

/**
 * @import {
 *   CreateProcessInstanceResponse,
 *   DeployResourceResponse
 * } from '@camunda8/sdk/dist/c8/lib/C8Dto';
 */

import EventEmitter from 'events';
import { getProcessId } from './utils/element';

export const INTERVAL_MS = 1000;

export const SCOPES = {
  LOCAL: 'LOCAL',
  PROCESS: 'PROCESS'
};


/**
 * Emits:
 * - `taskExecution.status.changed` with one of {@link TaskExecutionStatus}
 * - `taskExecution.finished` with {@link TaskExecutionResult} (includes all completion outcomes: success, incident, cancellations, errors)
 */
export default class TaskExecution extends EventEmitter {

  /**
   * @param {import('didi').Injector} injector
   * @param {TaskExecutionApi} api
   */
  constructor(injector, api) {
    super();

    /** @type {TaskExecutionApi} */
    this._api = api;

    this._interval = null;

    /** @type {TaskExecutionStatus} */
    this._status = 'idle';

    const eventBus = injector.get('eventBus');

    eventBus.on('selection.changed', () => {
      this.cancelTaskExecution('user.selectionChanged');
    });
  }

  /**
   * Start task execution.
   *
   * @param {import('./types').Element} element
   * @param {Object} variables
   *
   * @returns {Promise<void>}
   */
  async executeTask(element, variables) {
    const processId = getProcessId(element);

    if (!processId) {
      return;
    }

    this._changeStatus('deploying');

    const deploymentResult = await this._api.deploy();

    if (this._status === 'idle') {

      // Execution was canceled in the meantime
      return;
    }

    if (!deploymentResult.success) {
      const error = { message: 'Failed to deploy process definition', response: deploymentResult.error };
      this.cancelTaskExecution('error', error);
      return;
    }

    const processDefinitionKey = getProcessDefinitionKey(deploymentResult.response, processId);

    if (!processDefinitionKey) {
      const error = { message: 'Failed to retrieve process definition key from deployment response', response: deploymentResult.response };

      this.cancelTaskExecution('error', error);

      return;
    }

    this._changeStatus('starting-instance');

    const startInstanceResult = await this._api.startInstance(processDefinitionKey, element.id, variables);

    if (/** @type {TaskExecutionStatus} */ (this._status) === 'idle') {

      // Execution was canceled in the meantime
      return;
    }

    if (!startInstanceResult.success) {
      const error = { message: 'Failed to start process instance', response: startInstanceResult.error };
      this.cancelTaskExecution('error', error);
      return;
    }

    const processInstanceKey = getProcessInstanceKey(startInstanceResult.response);

    if (!processInstanceKey) {
      const error = { message: 'Failed to retrieve process instance key from start instance response' };
      this.cancelTaskExecution('error', error);
      return;
    }

    this._changeStatus('executing', processInstanceKey);

    const intervalCallback = async () => {
      const getProcessInstanceResult = await this._api.getProcessInstance(processInstanceKey);

      if (this._status === 'idle') {

        // Execution was canceled in the meantime
        this.cancelTaskExecution();
        return;
      }

      if (!getProcessInstanceResult.success) {
        this.cancelTaskExecution('error', {
          message: 'Failed to get process instance',
          response: getProcessInstanceResult.error
        });
        return;
      }

      const processInstance = getProcessInstance(getProcessInstanceResult.response, processInstanceKey);

      if (!processInstance) {

        // No process instance found, try again
        return;
      }

      const state = getProcessInstanceState(getProcessInstanceResult.response, processInstanceKey);
      const hasIncident = hasProcessInstanceIncident(getProcessInstanceResult.response, processInstanceKey);
      let incident = null;

      if (hasIncident) {
        const getProcessInstanceIncidentResult = await this._api.getProcessInstanceIncident(processInstanceKey);

        if (/** @type {TaskExecutionStatus} */ (this._status) === 'idle') {

          // Execution was canceled in the meantime
          this.cancelTaskExecution();
          return;
        }

        if (!getProcessInstanceIncidentResult.success) {
          this.cancelTaskExecution('error', {
            message: 'Failed to get process instance incident',
            response: getProcessInstanceIncidentResult.error
          });
          return;
        }

        incident = getIncident(getProcessInstanceIncidentResult.response);
      }

      const isCompleted = [ 'COMPLETED', 'TERMINATED', 'CANCELED' ].includes(state);

      if (isCompleted || hasIncident) {
        const getProcessInstanceVariablesResult = await this._api.getProcessInstanceVariables(processInstanceKey);

        if (/** @type {TaskExecutionStatus} */ (this._status) === 'idle') {

          // Execution was canceled in the meantime
          this.cancelTaskExecution();
          return;
        }

        if (!getProcessInstanceVariablesResult.success) {
          this.cancelTaskExecution('error', {
            message: 'Failed to get process instance variables',
            response: getProcessInstanceVariablesResult.error
          });
          return;
        }

        const getProcessInstanceElementInstancesResult = await this._api.getProcessInstanceElementInstances(processInstanceKey);

        if (/** @type {TaskExecutionStatus} */ (this._status) === 'idle') {

          // Execution was canceled in the meantime
          this.cancelTaskExecution();
          return;
        }

        if (!getProcessInstanceElementInstancesResult.success) {
          this.cancelTaskExecution('error', {
            message: 'Failed to get process instance element instances',
            response: getProcessInstanceElementInstancesResult.error
          });
          return;
        }

        const variables = getVariables(
          getProcessInstanceVariablesResult.response.items,
          getProcessInstanceElementInstancesResult.response.items,
          processInstance,
          element.id
        );

        this.emit('taskExecution.finished', incident ? {
          success: false,
          reason: 'incident',
          incident,
          variables
        } : {
          success: true,
          variables
        });

        this.cancelTaskExecution();
      }
    };

    this._interval = setInterval(intervalCallback, INTERVAL_MS);
  }

  /**
   * Cancel current task execution, clean up and change status to `idle`.
   *
   * @param {string} [reason] - Reason for cancellation: 'user.cancel', 'user.selectionChanged', or 'error'
   * @param {any} [error] - Error object when reason is 'error'
   */
  async cancelTaskExecution(reason, error) {

    // TODO: Proper clean up:
    // - delete process instance
    // - delete process definition
    // - cancel deploy and start instance if they are in progress

    const wasCanceled = this._status !== 'idle';

    if (this._interval) {
      clearInterval(this._interval);
    }

    this._changeStatus('idle');

    if (wasCanceled && reason) {
      this.emit('taskExecution.finished', reason === 'error' ? {
        success: false,
        reason,
        error
      } : {
        success: false,
        reason
      });
    }
  }

  /** @param {TaskExecutionStatus} status */
  _changeStatus(status, ...args) {

    if (this._status === status) {
      return;
    }

    this._status = status;
    this.emit('taskExecution.status.changed', status, ...args);
  }
}

/**
 * Get the process instance key from the response.
 *
 * @param {CreateProcessInstanceResponse} response
 *
 * @returns {string|null} The process instance key or null if not found.
 */
function getProcessInstanceKey(response) {
  const { processInstanceKey } = response;

  return processInstanceKey || null;
}

function getProcessInstance(response, processInstanceKey) {
  const { items = [] } = response;

  if (!items.length) {
    return null;
  }

  return items.find(item => item.processInstanceKey === processInstanceKey) || null;
}

function getProcessInstanceState(response, processInstanceKey) {
  const processInstance = getProcessInstance(response, processInstanceKey);

  if (!processInstance) {
    return null;
  }

  return processInstance.state;
}

function hasProcessInstanceIncident(response, processInstanceKey) {
  const processInstance = getProcessInstance(response, processInstanceKey);

  if (!processInstance) {
    return false;
  }

  return processInstance.hasIncident || false;
}

export function getVariables(getVariablesResponseItems, getElementInstancesResponseItems, processInstance, elementId) {
  const variables = {};

  for (const getVariablesResponseItem of getVariablesResponseItems) {
    const { name, value, variableKey } = getVariablesResponseItem;

    const scope = getScope(getVariablesResponseItem, getElementInstancesResponseItems, processInstance, elementId);

    try {
      variables[variableKey] = {
        name,
        value: JSON.parse(value),
        scope
      };
    } catch {
      variables[variableKey] = {
        name,
        value,
        scope
      };
    }
  }

  return variables;
}

function getIncident(response) {
  const { items = [] } = response;

  if (!items.length) {
    return null;
  }

  return items[0];
}

function getScope(variable, elementInstances, processInstance, elementId) {
  const { scopeKey } = variable;

  const elementInstance = elementInstances.find(elementInstance => {
    return elementInstance.elementInstanceKey === scopeKey && elementInstance.elementId === elementId;
  });

  if (elementInstance) {
    return SCOPES.LOCAL;
  }

  const { processInstanceKey } = processInstance;

  if (scopeKey === processInstanceKey) {
    return SCOPES.PROCESS;
  }

  return null;
}

/**
 * Get the process definition key from the deployment response.
 *
 * @param {import('@camunda8/sdk/dist/c8/lib/C8Dto').DeployResourceResponse} deployResponse
 * @param {string} processId
 *
 * @returns {string|null}
 */
export function getProcessDefinitionKey(deployResponse, processId) {
  const { deployments = [] } = deployResponse;

  for (const deployment of deployments) {
    if ('processDefinition' in deployment) {
      const { processDefinition } = deployment;

      if (processDefinition.processDefinitionId === processId) {
        return processDefinition.processDefinitionKey;
      }
    }
  }

  return null;
}