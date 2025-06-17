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
 * deploymentConfig //// await this._deployment.getConfigForFile(file);
 * deploy(deploymentConfig) => Promise<{ success: boolean, response: any }> //// deploymentResponse
 * getProcessId(deploymentResponse, fileName) => string //// file.name
 * startInstance(processId, config) => Promise<{ success: boolean, response: any }> //// startInstanceResult
 */

export default class Test {
  constructor(props) {

    const {
      deploymentConfig,
      deploy,
      getProcessId,
      startInstance,
      file // get rid of it
    } = props;

    this._getProcessId = getProcessId;
    this._deploymentConfig = deploymentConfig;
    this._deploy = deploy;
    this._startInstance = startInstance;
    this._file = file;
  }

  async run(elementId, variables, callback) {

    const deploymentConfig = this._deploymentConfig;
    const file = this._file;

    const deploymentResponse = await this._deploy(deploymentConfig);

    if (!deploymentResponse.success) {
      console.log('Deployment error', deploymentResponse.response.details || deploymentResponse.response.message);

      return deploymentResponse;
    }

    if (deploymentResponse.success) {
      const processId = this._getProcessId(deploymentResponse, file.name);

      if (!processId) {
        console.log('No process id found');

        return;
      }

      // const startInstanceConfig = await this._startInstance.getConfigForFile(file);

      const startInstanceResult = await this._startInstance.startInstance(processId, {
        ...deploymentConfig,
        variables,
        startInstructions:[
          {
            elementId
          }
        ],
        withResult: false // withResult does not support start instructions
      });

      if (startInstanceResult.success) {
        console.log('Start instance result', startInstanceResult.response);

        const { processInstanceKey } = startInstanceResult.response;

        const intervalCallback = async () => {
          const getProcessInstanceResult = await this._zeebeAPI.getProcessInstance(deploymentConfig.endpoint, processInstanceKey);

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
      } else {
        console.log('Start instance error', startInstanceResult.response.details || startInstanceResult.response.message);
      }
    }
  }

  async getInput() {
    const file = this._file;

    const startInstanceConfig = await this._startInstance.getConfigForFile(file);

    const { variables } = startInstanceConfig;

    return variables;
  }
}