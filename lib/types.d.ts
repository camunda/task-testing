import type {
  CreateProcessInstanceResponse,
  Deployment,
  DeployResourceResponse
} from '@camunda8/sdk/dist/zeebe/types';

import type {
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

export type Element = {
  id: string;
  businessObject: ModdleElement;
};

export type ModdleElement = {
  $type: string;
  id: string;
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

export type DeploymentResponse = DeployResourceResponse<Deployment>;

export type DeploymentResult = {
  success: boolean;
  response: DeploymentResponse;
}

export type StartInstanceResponse = CreateProcessInstanceResponse;

export type StartInstanceResult = {
  success: boolean;
  response: StartInstanceResponse;
}

export type GetProcessInstanceResult = {
  success: boolean;
  response: SearchProcessInstanceResponse;
}

export type GetProcessInstanceVariablesResult = {
  success: boolean;
  response: SearchVariablesResponse;
}

export type GetProcessInstanceIncidentResult = {
  success: boolean;
  response: SearchIncidentsResponse;
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
  export interface Progress {
    description: string;
  }
  export interface Start {}
}
