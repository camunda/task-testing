/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import EventEmitter from 'events';

const INTERVAL_MS = 1000;

export default class TaskExecution extends EventEmitter {

  /**
   * @param {Object} injector
   * @param {import('./types').TaskExecutionApi} api
   */
  constructor(injector, api) {
    super();

    this._injector = injector;

    /** @type {import('./types').TaskExecutionApi} */
    this._api = api;

    const eventBus = injector.get('eventBus');

    eventBus.on([ 'selection.changed', 'commandStack.changed' ], () => {
      this.cancelTaskExecution();
    });

    this._currentTaskExecution = null;
  }

  async _cancelTaskExecution() {
    if (!this._currentTaskExecution) {
      return;
    }

    const {
      interval,
      processInstanceKey,
      processDefinitionKey
    } = this._currentTaskExecution;

    if (interval) {
      clearInterval(interval);
    }

    if (processInstanceKey) {

      // TODO: delete process instance
    }

    if (processDefinitionKey) {

      // TODO: delete process definition
    }

    // TODO: cancel deploy and start instance if they are in progress

    this._currentTaskExecution = null;
  }

  async cancelTaskExecution() {
    if (!this._currentTaskExecution) {
      return;
    }

    await this._cancelTaskExecution();

    /** @type {import('./types').TaskExecutionEvents.Cancelled} */
    this.emit('taskExecution.cancelled');
  }

  async endTaskExecution() {
    if (!this._currentTaskExecution) {
      return;
    }

    const {
      incident,
      variables
    } = this._currentTaskExecution;

    await this._cancelTaskExecution();

    /** @type {import('./types').TaskExecutionEvents.End} */
    this.emit('taskExecution.end', {
      incident,
      success: !incident,
      variables
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
    await this.cancelTaskExecution();

    this._currentTaskExecution = {
      incident: null,

      /** @type {null | ReturnType<typeof setInterval>} */
      interval: null,

      /** @type {string|null} */
      processDefinitionKey: null,

      /** @type {string|null} */
      processInstanceKey: null,

      /** @type {Object<string, any>|null} */
      variables: null
    };

    /** @type {import('./types').TaskExecutionEvents.Start} */
    this.emit('taskExecution.start');

    const deploymentResult = await this._api.deploy();

    if (!deploymentResult.success) {
      this.emitError('Failed to deploy process definition', deploymentResult.error);

      await this.cancelTaskExecution();

      return;
    }

    const processId = getProcessId(deploymentResult.response);

    if (!processId) {
      this.emitError('Failed to retrieve process ID from deployment response');

      await this.cancelTaskExecution();

      return;
    }

    this._currentTaskExecution.processDefinitionKey = getProcessDefinitionKey(deploymentResult.response);

    const startInstanceResult = await this._api.startInstance(processId, elementId, variables);

    if (!startInstanceResult.success) {
      this.emitError('Failed to start process instance', startInstanceResult.error);

      await this.cancelTaskExecution();

      return;
    }

    const processInstanceKey = getProcessInstanceKey(startInstanceResult.response);

    if (!processInstanceKey) {
      this.emitError('Failed to retrieve process instance key from start instance response');

      await this.cancelTaskExecution();

      return;
    }

    this._currentTaskExecution.processInstanceKey = processInstanceKey;

    const intervalCallback = async () => {
      const getProcessInstanceResult = await this._api.getProcessInstance(processInstanceKey);

      if (!getProcessInstanceResult.success) {
        this.emitError('Failed to get process instance', getProcessInstanceResult.error);

        return;
      }

      const processInstance = getProcessInstance(getProcessInstanceResult.response, processInstanceKey);

      if (!processInstance) {

        // No process instance found, try again
        return;
      }

      const state = getProcessInstanceState(getProcessInstanceResult.response, processInstanceKey),
            hasIncident = hasProcessInstanceIncident(getProcessInstanceResult.response);

      if (hasIncident) {
        const getProcessInstanceIncidentResult = await this._api.getProcessInstanceIncident(processInstanceKey);

        if (!getProcessInstanceIncidentResult.success) {
          this.emitError('Failed to get process instance incident', getProcessInstanceIncidentResult.error);

          return;
        }

        const incident = getIncident(getProcessInstanceIncidentResult.response);

        if (this._currentTaskExecution) {
          this._currentTaskExecution.incident = incident;
        }

        this.endTaskExecution();

        return;
      }

      if ([ 'TERMINATED', 'COMPLETED', 'CANCELED' ].includes(state)) {
        const getProcessInstanceVariablesResult = await this._api.getProcessInstanceVariables(processInstanceKey);

        if (!getProcessInstanceVariablesResult.success) {
          this.emitError('Failed to get process instance variables', getProcessInstanceVariablesResult.error);
        } else {
          if (this._currentTaskExecution) {
            this._currentTaskExecution.variables = getVariables(getProcessInstanceVariablesResult.response);
          }
        }

        this.endTaskExecution();
      }
    };

    this._currentTaskExecution.interval = setInterval(intervalCallback, INTERVAL_MS);
  }

  emitError(message, detail) {

    /** @type {import('./types').TaskExecutionEvents.Error} */
    this.emit('taskExecution.error', {
      message,
      detail
    });
  }
}

/**
 * Get the process ID from the deployment response.
 *
 * @param {import('./types').DeploymentResponse} [response]
 *
 * @returns {string|null} The process ID or null if not found.
 */
function getProcessId(response) {
  if (!response) {
    return null;
  }

  const { processes = [] } = response;

  for (const process of processes) {
    if (process) {
      return process.processDefinitionId;
    }
  }

  return null;
}

/**
 * Get the process definition key from the deployment response.
 *
 * @param {import('./types').DeploymentResponse} [response]
 *
 * @returns {string|null} The process definition key or null if not found.
 */
function getProcessDefinitionKey(response) {
  if (!response) {
    return null;
  }

  const { processes = [] } = response;

  for (const process of processes) {
    if (process) {
      return process.processDefinitionKey;
    }
  }

  return null;
}

/**
 * Get the process instance key from the response.
 *
 * @param {import('./types').StartInstanceResponse} [response]
 *
 * @returns {string|null} The process instance key or null if not found.
 */
function getProcessInstanceKey(response) {
  if (!response) {
    return null;
  }

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

function hasProcessInstanceIncident(response) {
  const processInstance = getProcessInstance(response);

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