export const injector = {
  get() {
    return {
      on: () => {},
      off: () => {},
    };
  }
};

export function saveFile() {}

export function deploy() {
  return {
    success: true,
    response: {
      deploymentKey: 'mock-deployment-key',
      tenantId: 'mock-tenant-id',
      deployments: [
        {
          processDefinition: {
            processId: 'mock-process-id'
          }
        }
      ]
    }
  };
}

export function startInstance(processId, config) {
  return {
    success: true,
    response: {
      processInstanceKey: 'mock-process-instance-key'
    }
  };
}

export function getInstance(processId, config) {
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
