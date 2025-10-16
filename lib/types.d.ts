import type {
  CreateProcessInstanceResponse,
  DeployResourceResponse,
  SearchProcessInstanceResponse,
  SearchVariablesResponse,
  SearchElementInstancesResponse,
  SearchIncidentsResponse
} from '@camunda8/sdk/dist/c8/lib/C8Dto';

export type Input = {
  [elementId: string]: string;
};

export type Output = {
  [elementId: string]: ElementOutput
};

export type ElementOutput = {
  success: boolean;
  variables?: { [key: string]: string };
  error?: TaskExecutionEvents.Error;
  incident?: any;
  operateUrl?: string;
  [key: string]: any;
} | undefined;

export type Config = {
  input: Input;
  output: Output;
};

export type Variable = {
  name: string;
  type?: string;
  info?: string;
  isList?: boolean;
  entries?: Variable[];
  scope?: ModdleElement;
};

export type Variables = Variable[];

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
  variables?: { [key: string]: any };
  error?: TaskExecutionError;
  incident?: any;
}

export type TaskExecutionError = {
  message: string;
  response?: any;
};

export type { Element, ModdleElement } from 'bpmn-js/lib/model/Types';