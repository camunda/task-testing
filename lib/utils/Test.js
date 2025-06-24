/**
 * @typedef {import('@camunda8/sdk/dist/c8/lib/C8Dto').DeployResourceResponse} DeployResponse
 * @typedef {import('@camunda8/sdk/dist/c8/lib/C8Dto').CreateProcessInstanceResponse} StartInstanceResponse
 *
 * @typedef {import('@camunda8/sdk/dist/operate/lib/OperateDto').ProcessInstance} GetInstanceResponse // ???
 */

export default class Test {

  /**
   * @param {() => Promise<DeployResponse>} deploy
   * @param {(deploymentResponse: DeployResponse) => Promise<StartInstanceResponse>} startInstance
   * @param {(processInstanceKey: string|number) => Promise<GetInstanceResponse>} getInstance
   */
  constructor(deploy, startInstance, getInstance) {

    this._deploy = deploy;
    this._startInstance = startInstance;
    this._getInstance = getInstance;
  }

  /**
   * @param {string} elementId
   * @param {Object} variables
   * @param {(elementId: string, message: string) => any} log
   */
  async run(elementId, variables, log) {

    log(elementId, 'Deploying process...');

    // 1. Deploy
    const deploymentResponse = await this._deploy();
    console.log('Deployment response', deploymentResponse);

    log(elementId, 'Deployment successful');

    // 2. Start instance
    const startInstanceResult = await this._startInstance(deploymentResponse, variables, elementId);

    console.log('Start instance result', startInstanceResult);

    log(elementId, 'Starting process instance...');


    // 3. Get process insance result until finished or failed
    const { processInstanceKey } = startInstanceResult.response;

    const intervalCallback = async () => {
      const getProcessInstanceResult = await this._getInstance(processInstanceKey);

      console.log('Get process instance', getProcessInstanceResult);

      if (!getProcessInstanceResult.success) {
        console.error('Get process instance error', getProcessInstanceResult);

        // callback(elementId, 'Process instance not found');
      } else {
        console.log('Process instance', getProcessInstanceResult);

        log(elementId, 'Process instance found');
        log(elementId, JSON.stringify(getProcessInstanceResult.response.variables, null, 2));

        clearInterval(interval);
      }
    };

    const interval = setInterval(intervalCallback, 1000);
  }
}