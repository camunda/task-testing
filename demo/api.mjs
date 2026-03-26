/**
 * Shared Camunda REST API wrapper.
 *
 * createApi(client) returns an object whose methods mirror the SDK calls used
 * by both demo/server.mjs and test/recording/run.mjs. Every method returns a
 * `{ success: true, response }` or `{ success: false, error }` object so
 * callers never need their own try/catch. Recording stays with the caller.
 *
 * Response-shape helpers are also exported here since they depend only on the
 * result structures produced by these methods.
 */

/**
 * @import { CamundaClient } from '@camunda8/orchestration-cluster-api'
 */

import { isObject } from 'min-dash';

const waitUpToMs = 0;
const waitUpToMsProcessInstance = 10000;

const SDK_ERROR_NAMES = new Set([
  'HttpSdkError',
  'ValidationSdkError',
  'AuthSdkError',
  'NetworkSdkError',
  'CancelSdkError',
]);

function isSdkError(err) {
  return !!err && isObject(err) && 'name' in err && SDK_ERROR_NAMES.has(err.name);
}

async function safe(promise) {
  try {
    const response = await promise;
    return { success: true, response };
  } catch (err) {
    if (isSdkError(err)) {
      return {
        success: false,
        error: err.message,
        errorType: err.name,          // e.g. 'HttpSdkError'
        status: err.status ?? null,   // present on HttpSdkError / AuthSdkError
        detail: err.detail ?? null,   // RFC 9457 detail, present on HttpSdkError
        operationId: err.operationId ?? null
      };
    }

    return { success: false, error: err.message, errorType: 'UnknownError' };
  }
}

/**
 * @param {CamundaClient} client
 */
export function createApi(client) {
  return {

    /** @param {Array<{ name: string, content: string }>} resources */
    deployResources(resources) {
      const files = resources.map(({ name, content }) => {
        const mimeType = name.endsWith('.bpmn') || name.endsWith('.dmn') || name.endsWith('.xml')
          ? 'application/xml'
          : name.endsWith('.form') || name.endsWith('.json')
            ? 'application/json'
            : 'application/octet-stream';

        return new File([content], name, { type: mimeType });
      });

      return safe(client.createDeployment({ resources: files }));
    },

    /**
     * Starts a process instance scoped to a single element, which is also
     * used as the TERMINATE_PROCESS_INSTANCE instruction target.
     */
    createProcessInstance({ processDefinitionKey, variables = {}, elementId }) {
      return safe(client.createProcessInstance({
        processDefinitionKey,
        variables,
        startInstructions: [ { elementId } ],
        runtimeInstructions: [
          { type: 'TERMINATE_PROCESS_INSTANCE', afterElementId: elementId }
        ]
      }));
    },

    searchProcessInstances(processInstanceKey) {
      return safe(client.searchProcessInstances({
        filter: { processInstanceKey }
      }, {
        consistency: {
          waitUpToMs: waitUpToMsProcessInstance,
          predicate: (result) => Array.isArray(result.items) && result.items.length > 0
        }
      }));
    },

    searchVariables(processInstanceKey) {
      return safe(client.searchVariables({
        filter: { processInstanceKey },
        truncateValues: false
      }, {
        consistency: { waitUpToMs }
      }));
    },

    searchJobs(processInstanceKey) {
      return safe(client.searchJobs({
        filter: {
          processInstanceKey
        }
      }, {
        consistency: { waitUpToMs }
      }));
    },

    searchUserTasks(processInstanceKey) {
      return safe(client.searchUserTasks({
        filter: {
          processInstanceKey
        }
      }, {
        consistency: { waitUpToMs }
      }));
    },

    searchMessageSubscriptions(processInstanceKey) {
      return safe(client.searchMessageSubscriptions({
        filter: {
          processInstanceKey
        }
      }, {
        consistency: { waitUpToMs }
      }));
    },

    searchElementInstances(processInstanceKey) {
      return safe(client.searchElementInstances({
        filter: { processInstanceKey }
      }, {
        consistency: { waitUpToMs }
      }));
    },

    searchIncidents(processInstanceKey) {
      return safe(client.searchIncidents({
        filter: { processInstanceKey }
      }, {
        consistency: { waitUpToMs }
      }));
    }
  };
}

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

export function getProcessInstanceKey(response) {
  const { processInstanceKey } = response;
  return processInstanceKey || null;
}

function getProcessInstance(response, processInstanceKey) {
  const { items = [] } = response;
  if (!items.length) return null;
  return items.find(item => item.processInstanceKey === processInstanceKey) || null;
}

export function getProcessInstanceState(response, processInstanceKey) {
  const processInstance = getProcessInstance(response, processInstanceKey);
  return processInstance ? processInstance.state : null;
}

export function hasProcessInstanceIncident(response, processInstanceKey) {
  const processInstance = getProcessInstance(response, processInstanceKey);
  return processInstance ? (processInstance.hasIncident || false) : false;
}
