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
 * @param {(elementId: string, message: string) => void} log - Function to log messages.
 * @param {Camunda8Api} api - Wrapper for Camunda 8 API for deploying, starting and getting process instance.
 *
 * @return {Promise<void>} - A promise that resolves when the process instance is found or an error occurs.
 */
export default async function Run(elementId, variables, log, api) {

  const {
    deploy,
    startInstance,
    getInstance
  } = api;

  // 1. Deploy
  log(elementId, 'Deploying process...');

  const deploymentResponse = await deploy();
  console.log('Deployment response', deploymentResponse);

  // 2. Start instance
  log(elementId, 'Starting process instance...');

  const startInstanceResult = await startInstance(deploymentResponse, variables, elementId);

  console.log('Start instance result', startInstanceResult);


  // 3. Get process insance result until finished or failed
  const { processInstanceKey } = startInstanceResult.response;

  const intervalCallback = async () => {
    const getProcessInstanceResult = await getInstance(processInstanceKey);

    console.log('Get process instance', getProcessInstanceResult);

    if (!getProcessInstanceResult.success) {
      console.error('Get process instance error', getProcessInstanceResult);

    } else {
      console.log('Process instance', getProcessInstanceResult);

      log(elementId, 'Process instance found');
      log(elementId, JSON.stringify(getProcessInstanceResult.response.variables, null, 2));

      clearInterval(interval);
    }
  };

  const interval = setInterval(intervalCallback, 1000);
}

async function pingProcessInstance(getInstance, key, intervalMs = 1000, maxAttempts = 10) {

  return new Promise((resolve, reject) => {
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts += 1;

      try {
        const getProcessInstanceResult = await getInstance(key);
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }



      if (attempts >= maxAttempts) {
        clearInterval(interval);
        resolve(false);
      } else {
        console.log('Ping successful');
        resolve(true);
      }
    }, intervalMs);
  });
}