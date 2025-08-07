export const injector = {
  get() {
    return {
      on: () => {},
      off: () => {},
      get: () => []
    };
  }
};

export async function deploy() {
  await new Promise(resolve => setTimeout(resolve, 2000));
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
  await new Promise(resolve => setTimeout(resolve, 1000));
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
    response: {
      key: 'mock-process-id',
      state: 'COMPLETED',
      variables: {
        success: true,
        executionTime: 123456,
        url: 'http://now-go-here.com',
        foo: 'bar',
        baz: 42,
        nested: {
          value: 'nestedValue',
          one: 1,
          false: false,
        },
        long: 'This is a long string that exceeds the typical length of a variable value in a process instance. It is used to test how the output handles larger data and ensures that the UI can display it correctly without truncation or errors.',
        this: 'is',
        a: 'long',
        block: 'of',
        variables: 'to',
        test: 'the',
        vertical: 'scrolling',
        behavior: 'of the',
        output: 'section'
      }
    }
  };
}

export const appProps = {
  injector,
  config: {},
  saveConfig: () => {},
  deploy,
  startInstance,
  getInstance
};
