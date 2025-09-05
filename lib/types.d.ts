import type {
  CreateProcessInstanceResponse,
  DeployResourceResponse,
  SearchProcessInstanceResponse,
  SearchVariablesResponse,
  SearchIncidentsResponse
} from '@camunda8/sdk/dist/c8/lib/C8Dto';

export type Input = {
  [id: string]: string;
};

export type Output = {
  [id: string]: {
    error?: any;
    incident?: any;
    success: boolean;
    variables?: { [key: string]: any };
  }
};

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

export namespace TaskExecutionEvents {
  export interface Cancelled {}
  export interface Error {
    message: string;
    response?: any;
  }
  export interface End {
    incident?: any;
    success: boolean;
    variables?: { [key: string]: any };
  }
  export interface Start {}
}

export type { Element, ModdleElement } from 'bpmn-js/lib/model/Types';