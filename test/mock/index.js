export const injector = {
  get() {
    return {
      on: () => {},
      off: () => {},
    };
  }
};

export function saveFile() {}

export const deploymentConfig = {
  tenantId: 'mock-tenant-id',
  deploymentKey: 'mock-deployment-key',
  resources: [
    {
      content: 'mock-content',
      name: 'mock-process.bpmn'
    }
  ]
};

export function deployResources(resources, tenantId) {
  return {
    deploymentKey: 'mock-deployment-key',
    tenantId: tenantId,
    deployments: [
      {
        processDefinition: {
          processId: 'mock-process-id'
        }
      }
    ]
  };
}

export function createProcessInstance(processId, config) {
  return {
    processInstanceKey: 'mock-process-instance-key'
  };
}

export function getProcessInstance(processId, config) {
  return {
    success: true,
    type: 'instanceFound',
    response: {
      processId: 'mock-process-id',
      variables: {
        input: 'mock-input',
        output: 'mock-output'
      }
    }
  };
}
