import type {
    CamundaClient,
    CreateProcessInstanceResult,
    ElementInstanceResult,
    ElementInstanceSearchQueryResult,
    IncidentResult,
    IncidentSearchQueryResult,
    ProcessInstanceResult,
    ProcessInstanceSearchQueryResult,
    ProcessInstanceStateEnum,
    VariableSearchQueryResult,
    VariableSearchResult
} from '@camunda8/orchestration-cluster-api';
import type {ModdleElement} from "bpmn-js/lib/model/Types";

type ExtendedDeploymentResult = Awaited<ReturnType<CamundaClient['createDeployment']>>;

export type {
    CreateProcessInstanceResult,
    ElementInstanceSearchQueryResult,
    IncidentSearchQueryResult,
    ProcessInstanceSearchQueryResult,
    ProcessInstanceResult,
    VariableSearchQueryResult,
    ExtendedDeploymentResult,
    ProcessInstanceStateEnum,
    VariableSearchResult,
    ElementInstanceResult,
    IncidentResult
}


export type Input = {
    [elementId: string]: string;
};

export type Output = {
    [elementId: string]: ElementOutput
};

export type VARIABLE_SCOPE = 'LOCAL' | 'PROCESS';

export type ElementOutputVariables = {
    [id: string]: {
        name: string;
        value: any;
        scope: VARIABLE_SCOPE;
    }
};

export type ElementOutput = {
    success: boolean;
    variables?: ElementOutputVariables;
    error?: TaskExecutionError;
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
    deploy: () => Promise<ApiResponse<ExtendedDeploymentResult>>;
    startInstance: (processDefinitionKey: string, elementId: string, variables: {
        [key: string]: any
    }) => Promise<ApiResponse<CreateProcessInstanceResult>>;
    getProcessInstance: (processInstanceKey: string) => Promise<ApiResponse<ProcessInstanceSearchQueryResult>>;
    getProcessInstanceVariables: (processInstanceKey: string) => Promise<ApiResponse<VariableSearchQueryResult>>;
    getProcessInstanceElementInstances: (processInstanceKey: string) => Promise<ApiResponse<ElementInstanceSearchQueryResult>>;
    getProcessInstanceIncident: (processInstanceKey: string) => Promise<ApiResponse<IncidentSearchQueryResult>>;
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
    variables?: ElementOutputVariables;
    error?: TaskExecutionError;
    incident?: any;
}

export type TaskExecutionError = {
    message: string;
    response?: any;
};

export type {Element, ModdleElement} from 'bpmn-js/lib/model/Types';

export type Plugin = {
    priority?: number;
    render: Function;
    type: string;
    [key: string]: any;
};

export type PluginContextValue = {
    plugins: Plugin[];
    registerPlugin: (plugin: Plugin) => void;
    unregisterPlugin: (plugin: Plugin) => void;
    getPlugins: (pluginPoint: string) => Plugin[];
};