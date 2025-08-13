/**
 * Represents the response from Camunda REST API `deployResources` method.
 *
 * See the API docs:
 * {@link https://camunda.github.io/camunda-8-js-sdk/classes/index.CamundaRestClient.html#deployresources | Camunda 8 JS SDK docs}
 *
 * @typedef {import('@camunda8/sdk/dist/c8/lib/C8Dto').DeployResourceResponse} DeployResponse
 */

/**
 * Represents the response from Camunda REST API `createProcessInstance` method.
 *
 * See the API docs:
 * {@link https://camunda.github.io/camunda-8-js-sdk/classes/index.CamundaRestClient.html#createprocessinstance | Camunda 8 JS SDK docs}
 *
 * @typedef {import('@camunda8/sdk/dist/c8/lib/C8Dto').CreateProcessInstanceResponse} StartInstanceResponse
 */

/**
 * Represents the response from Camunda Operate API `getProcessInstance` method.
 *
 * See the API docs:
 * {@link https://camunda.github.io/camunda-8-js-sdk/classes/index.Operate.OperateApiClient.html#getprocessinstance | Camunda 8 JS SDK docs}
 */

/**
 * @typedef {Object} Camunda8Api
 * @property {() => Promise<DeployResponse>} deploy
 * @property {(deploymentResponse: DeployResponse) => Promise<StartInstanceResponse>} startInstance
 * @property {(processInstanceKey: string|number) => Promise<GetInstanceResponse>} getInstance
*/


/**
 * Run a single task by deploying the process, starting an instance, and polling for the instance status.
 *
 * @param {string} elementId - ID of the BPMN element to run.
 * @param {Object} variables - Input variables for the process instance.
 * @param {Camunda8Api} api - Wrapper for Camunda 8 API for deploying, starting and getting process instance.
 *
 * @return {Promise<void>} - A promise that resolves when the process instance is found or an error occurs.
 */
export default async function run(elementId, variables, api) {

  const {
    deploy,
    startInstance,
    getInstance
  } = api;

  // 1. Deploy
  const deploymentResponse = await deploy();

  // 2. Start instance
  const startInstanceResult = await startInstance(deploymentResponse, variables, elementId);

  // 3. Get process insance result until finished or failed
  const { processInstanceKey } = startInstanceResult.response;

  const pingResult = await pingProcessInstance(getInstance, processInstanceKey);

  if (!pingResult) {
    throw new Error('Process instance not found after maximum attempts');
  } else {

    return pingResult.response.variables;

    // throw new Error('Process instance not found after maximum attempts');
  }
}

async function pingProcessInstance(getInstance, key, intervalMs = 1000, maxAttempts = 10) {

  return new Promise((resolve, reject) => {
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts += 1;

      try {
        const result = await getInstance(key);

        if (result.response.state === 'COMPLETED') {
          return resolve(result);
        }
      } catch (error) {
        reject(error);
      } finally {
        clearInterval(interval);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        resolve(false);
      }

    }, intervalMs);
  });
}