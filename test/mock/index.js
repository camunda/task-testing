export const injector = {
  get() {
    return {
      on: () => {},
      off: () => {},
    };
  }
};

export function saveFile() {}

export async function deploy() {
  await new Promise(resolve => setTimeout(resolve, 3000));
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

export async function startInstance(processId, config) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    success: true,
    response: {
      processInstanceKey: 'mock-process-instance-key'
    }
  };
}

export async function getInstance(processId, config) {
  await new Promise(resolve => setTimeout(resolve, 1000));
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
