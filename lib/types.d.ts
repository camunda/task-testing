import type {
  CreateProcessInstanceResponse,
  DeployResourceResponse,
  SearchProcessInstanceResponse,
  SearchVariablesResponse,
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

export type DeploymentResponse = DeployResourceResponse;

export type DeploymentResult = {
  success: boolean;
  response?: DeploymentResponse;
  error?: string;
}

export type StartInstanceResponse = CreateProcessInstanceResponse;

export type StartInstanceResult = {
  success: boolean;
  response?: StartInstanceResponse;
  error?: string;
}

export type GetProcessInstanceResult = {
  success: boolean;
  response?: SearchProcessInstanceResponse;
  error?: string;
}

export type GetProcessInstanceVariablesResult = {
  success: boolean;
  response?: SearchVariablesResponse;
  error?: string;
}

export type GetProcessInstanceIncidentResult = {
  success: boolean;
  response?: SearchIncidentsResponse;
  error?: string;
}

export type TaskExecutionApi = {
  deploy: () => Promise<DeploymentResult>;
  startInstance: (processId: string, elementId: string, variables: { [key: string]: any }) => Promise<StartInstanceResult>;
  getProcessInstance: (processInstanceKey: string) => Promise<GetProcessInstanceResult>;
  getProcessInstanceVariables: (processInstanceKey: string) => Promise<GetProcessInstanceVariablesResult>;
  getProcessInstanceIncident: (processInstanceKey: string) => Promise<GetProcessInstanceIncidentResult>;
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
  'taskExecution.canceled';

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