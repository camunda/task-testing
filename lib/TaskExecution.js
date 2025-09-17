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

export const INTERVAL_MS = 1000;


/**
 * Emits:
 * - `taskExecution.status.changed` with one of {@link TaskExecutionStatus}
 * - `taskExecution.finished` with {@link TaskExecutionResult}
 * - `taskExecution.error` with {@link TaskExecutionError}
 * - `taskExecution.interrupted` when execution is interrupted by switching focus
 */
export default class TaskExecution extends EventEmitter {

  /**
   * @param {Object} injector
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

    eventBus.on([ 'selection.changed', 'commandStack.changed' ], () => {
      this.cancelTaskExecution();
      this.emit('taskExecution.interrupted');
    });
  }

  /**
   * Start task execution.
   *
   * @param {string} elementId
   * @param {Object} variables
   *
   * @returns {Promise<void>}
   */
  async executeTask(elementId, variables) {

    this._changeStatus('deploying');

    const deploymentResult = await this._api.deploy();

    if (this._status === 'idle') {

      // Execution was canceled in the meantime
      return;
    }

    if (!deploymentResult.success) {
      this._emitError('Failed to deploy process definition', deploymentResult.error);
      this.cancelTaskExecution();
      return;
    }

    const processId = getProcessId(deploymentResult.response);

    if (!processId) {
      this._emitError('Failed to retrieve process ID from deployment response');
      this.cancelTaskExecution();
      return;
    }

    this._changeStatus('starting-instance');

    const startInstanceResult = await this._api.startInstance(processId, elementId, variables);

    if (/** @type {TaskExecutionStatus} */ (this._status) === 'idle') {

      // Execution was canceled in the meantime
      return;
    }

    if (!startInstanceResult.success) {
      this._emitError('Failed to start process instance', startInstanceResult.error);
      this.cancelTaskExecution();
      return;
    }

    const processInstanceKey = getProcessInstanceKey(startInstanceResult.response);

    if (!processInstanceKey) {
      this._emitError('Failed to retrieve process instance key from start instance response');
      this.cancelTaskExecution();
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
        this._emitError('Failed to get process instance', getProcessInstanceResult.error);
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
          this._emitError('Failed to get process instance incident', getProcessInstanceIncidentResult.error);
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
          this._emitError('Failed to get process instance variables', getProcessInstanceVariablesResult.error);
          return;
        }

        const variables = getVariables(getProcessInstanceVariablesResult.response);
        this.emit('taskExecution.finished', {
          success: !incident,
          incident,
          variables
        });

        this.cancelTaskExecution();
      }
    };

    this._interval = setInterval(intervalCallback, INTERVAL_MS);
  }

  /**
   * Cancel current task execution, clean up and change status to `idle`.
   */
  async cancelTaskExecution() {

    // TODO: Proper clean up:
    // - delete process instance
    // - delete process definition
    // - cancel deploy and start instance if they are in progress

    if (this._interval) {
      clearInterval(this._interval);
    }

    this._changeStatus('idle');
  }

  /**
   * Emit `taskExecution.error` event.
   *
   * @param {string} message
   * @param {any} [response]
   */
  _emitError(message, response) {

    /** @type {import('./types').TaskExecutionError} */
    const error = {
      message,
      response
    };

    this.emit('taskExecution.error', error);
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
 * Get the process ID from the deployment response.
 *
 * @param {DeployResourceResponse} response
 *
 * @returns {string|null} The process ID or null if not found.
 */
function getProcessId(response) {
  const { processes = [] } = response;

  for (const process of processes) {
    if (process) {
      return process.processDefinitionId;
    }
  }

  return null;
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

function getVariables(response) {
  const { items = [] } = response;

  const variables = {};

  for (const item of items) {
    const { name, value } = item;

    try {
      variables[name] = JSON.parse(value);
    } catch {
      variables[name] = value;
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