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

    /** @type {import('./types').TaskExecutionEvents.Progress} */
    this.emit('taskExecution.progress', {
      description: 'Deploying...'
    });

    const deploymentResponse = await this._api.deploy();

    if (!deploymentResponse.success) {

      /** @type {import('./types').TaskExecutionEvents.Error} */
      this.emit('taskExecution.error', {
        message: 'Failed to deploy process definition',
        response: deploymentResponse
      });

      await this.cancelTaskExecution();

      return;
    }

    const processId = getProcessId(deploymentResponse.response);

    if (!processId) {

      /** @type {import('./types').TaskExecutionEvents.Error} */
      this.emit('taskExecution.error', {
        message: 'Failed to retrieve process ID from deployment response',
        response: deploymentResponse
      });

      await this.cancelTaskExecution();

      return;
    }

    this._currentTaskExecution.processDefinitionKey = getProcessDefinitionKey(deploymentResponse.response);

    /** @type {import('./types').TaskExecutionEvents.Progress} */
    this.emit('taskExecution.progress', {
      description: 'Creating process instance...'
    });

    const startInstanceResponse = await this._api.startInstance(processId, elementId, variables);

    if (!startInstanceResponse.success) {

      /** @type {import('./types').TaskExecutionEvents.Error} */
      this.emit('taskExecution.error', {
        message: 'Failed to start process instance',
        response: startInstanceResponse
      });

      await this.cancelTaskExecution();

      return;
    }

    /** @type {import('./types').TaskExecutionEvents.Progress} */
    this.emit('taskExecution.progress', {
      description: 'Waiting for process instance...'
    });

    const { processInstanceKey } = startInstanceResponse.response;

    this._currentTaskExecution.processInstanceKey = processInstanceKey;

    const intervalCallback = async () => {
      const getProcessInstanceResult = await this._api.getProcessInstance(processInstanceKey);

      if (!getProcessInstanceResult.success) {

        /** @type {import('./types').TaskExecutionEvents.Error} */
        this.emit('taskExecution.error', {
          message: 'Failed to get process instance',
          response: getProcessInstanceResult
        });

        return;
      }

      const processInstance = getProcessInstance(getProcessInstanceResult.response);

      if (!processInstance) {

        // No process instance found, try again
        return;
      }

      /** @type {import('./types').TaskExecutionEvents.Progress} */
      this.emit('taskExecution.progress', {
        description: 'Executing task...'
      });

      const state = getProcessInstanceState(getProcessInstanceResult.response),
            hasIncident = hasProcessInstanceIncident(getProcessInstanceResult.response);

      if (hasIncident) {
        const getProcessInstanceIncidentResult = await this._api.getProcessInstanceIncident(processInstanceKey);

        if (!getProcessInstanceIncidentResult.success) {

          /** @type {import('./types').TaskExecutionEvents.Error} */
          this.emit('taskExecution.error', {
            message: 'Failed to get process instance incident',
            response: getProcessInstanceIncidentResult
          });

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
          this.emit('taskExecution.error', {
            message: 'Failed to get process instance variables',
            response: getProcessInstanceVariablesResult
          });
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
}

/**
 * Get the process ID from the deployment response.
 *
 * @param {import('./types').DeploymentResponse} response
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
 * Get the process definition key from the deployment response.
 *
 * @param {import('./types').DeploymentResponse} response
 *
 * @returns {string|null} The process definition key or null if not found.
 */
function getProcessDefinitionKey(response) {
  const { processes = [] } = response;

  for (const process of processes) {
    if (process) {
      return process.processDefinitionKey;
    }
  }

  return null;
}

function getProcessInstance(response) {
  const { items = [] } = response;

  if (!items.length) {
    return null;
  }

  return items[0];
}

function getProcessInstanceState(response) {
  const processInstance = getProcessInstance(response);

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

    variables[name] = JSON.parse(value);
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