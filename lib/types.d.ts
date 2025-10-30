import type {
  CreateProcessInstanceResponse,
  DeployResourceResponse,
  SearchProcessInstanceResponse,
  SearchVariablesResponse,
  SearchElementInstancesResponse,
  SearchIncidentsResponse
} from '@camunda8/sdk/dist/c8/lib/C8Dto';

import type { Element as BpmnElement } from 'bpmn-js/lib/model/Types';

export type Config = {
  input: Input;
  output: Output;
};

export type Input = {
  [elementId: string]: string;
};

export type Output = {
  [elementId: string]: ElementOutput
};

export type ElementOutput = {
  [key: string]: any;
  success: boolean;
  variables: Variables;
  error?: TaskExecutionEvents.Error;
  incident?: any;
  operateUrl?: string;
};

export type Variables = {
  [id: string]: Variable
};

export type Variable = {
  name: string;
  value?: any;
  scope: VARIABLE_SCOPE;
  type: VARIABLE_TYPE;
  source: VARIABLE_SOURCE;
  sourceElementName?: string;
};

export type VARIABLE_SCOPE = 'LOCAL' | 'PROCESS';
export type VARIABLE_TYPE = 'String' | 'Number' | 'Boolean' | 'Object' | 'Array';
export type VARIABLE_SOURCE = 'PROCESS' | 'OUTPUT';

export type ApiResponse<T> =
  | {
      success: true;
      response: T;
    }
  | {
      success: false;
      error: string;
    }

export type TaskExecutionApi = {
  deploy: () => Promise<ApiResponse<DeployResourceResponse>>;
  startInstance: (processId: string, elementId: string, variables: { [key: string]: any }) => Promise<ApiResponse<CreateProcessInstanceResponse>>;
  getProcessInstance: (processInstanceKey: string) => Promise<ApiResponse<SearchProcessInstanceResponse>>;
  getProcessInstanceVariables: (processInstanceKey: string) => Promise<ApiResponse<SearchVariablesResponse>>;
  getProcessInstanceElementInstances: (processInstanceKey: string) => Promise<ApiResponse<SearchElementInstancesResponse>>;
  getProcessInstanceIncident: (processInstanceKey: string) => Promise<ApiResponse<SearchIncidentsResponse>>;
};

export type TaskExecutionStatus =
  'idle' |
  'deploying' |
  'starting-instance' |
  'executing';

export type TaskExecutionEvents = 
  'taskExecution.status.changed' |
  'taskExecution.finished' |
  'taskExecution.error' |
  'taskExecution.interrupted';

export type TaskExecutionResult = {
  success: boolean;
  variables?: Variables;
  error?: TaskExecutionError;
  incident?: any;
}

export type TaskExecutionError = {
  message: string;
  response?: any;
};

export type { BpmnElement };

export type ReactHook<T> = ReturnType<typeof React.useState<T>>;