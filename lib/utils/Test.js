/**
 * @typedef {import('@camunda8/sdk/dist/c8/lib/CamundaRestClient').deployResources} deployResources
 * @typedef {import('@camunda8/sdk/dist/c8/lib/CamundaRestClient').createProcessInstance} createProcessInstance
 * @typedef {import('@camunda8/sdk/dist/operate/lib/OperateApiClient').getProcessInstance} getProcessInstance
 * @typedef {import('@camunda8/sdk/dist/c8/lib/CamundaRestClient').Resource} resources
 *
 * @typedef {Object} DeploymentConfig
 * @property {{ content: string; name: string }[]} resources - Array of deployment resources
 * @property {string|number} tenantId - Tenant ID as string or number
 */

export default class Test {

  /**
   * @param {deployResources} deployResources
   * @param {createProcessInstance} createProcessInstance
   * @param {getProcessInstance} getProcessInstance
   * @param {DeploymentConfig} deploymentConfig
   */
  constructor(deployResources, deploymentConfig, createProcessInstance, getProcessInstance) {

    this._deployResources = deployResources;
    this._deploymentConfig = deploymentConfig;
    this._createProcessInstance = createProcessInstance;
    this._getProcessInstance = getProcessInstance;
  }

  async run(elementId, variables, callback) {

    const deploymentResponse = await this._deployResources(this._deploymentConfig);

    // 1. Deploy
    // 2. Start instance
    // 3. Get process insance result until

    console.log('Deployment response', deploymentResponse);

    // if (!deploymentResponse.success) {
    //   console.log('Deployment error', deploymentResponse.response.details || deploymentResponse.response.message);

    //   return deploymentResponse;
    // }

    const { deployments } = deploymentResponse;

    // Naive approach
    const processId = deployments?.[0]?.processDefinition?.processId;


    // if (!processId) {
    //   console.log('No process id found');

    //   return;
    // }

    // const startInstanceConfig = await this._startInstance.getConfigForFile(file);

    const startInstanceResult = await this._createProcessInstance(processId, {
      tenantId: this._deploymentConfig.tenantId,
      variables,
      startInstructions:[
        {
          elementId
        }
      ],
      withResult: false // withResult does not support start instructions
    });

    console.log('Start instance result', startInstanceResult);

    const { processInstanceKey } = startInstanceResult;

    const intervalCallback = async () => {
      const getProcessInstanceResult = await this._getProcessInstance(processInstanceKey);

      console.log('Get process instance', getProcessInstanceResult);

      if (!getProcessInstanceResult.success) {
        console.error('Get process instance error', getProcessInstanceResult);

        callback({
          type: 'instanceNotFound',
          response: getProcessInstanceResult
        });
      } else {
        console.log('Process instance', getProcessInstanceResult);

        callback({
          type: 'instanceFound',
          response: getProcessInstanceResult
        });

        clearInterval(interval);
      }
    };

    const interval = setInterval(intervalCallback, 1000);

    return {
      type: 'instanceStarted',
      response: startInstanceResult
    };

    // } else {
    //   console.log('Start instance error', startInstanceResult.response.details || startInstanceResult.response.message);
    // }
  }
}