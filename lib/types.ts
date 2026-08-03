import type {
  CreateProcessInstanceResult,
  DeploymentResult,
  ElementInstanceResult,
  ElementInstanceSearchQueryResult,
  IncidentResult,
  IncidentSearchQueryResult,
  JobSearchQueryResult,
  JobSearchResult,
  MessageSubscriptionResult,
  MessageSubscriptionSearchQueryResult,
  ProcessInstanceResult,
  ProcessInstanceSearchQueryResult,
  SearchQueryResponse,
  UserTaskResult,
  UserTaskSearchQueryResult,
  VariableSearchResult,
  VariableSearchQueryResult,
} from '@camunda8/orchestration-cluster-api';

import { ModdleElement } from 'bpmn-js/lib/model/Types';

import { TASK_EXECUTION_EVENT, TASK_EXECUTION_FINISHED_REASON, TASK_EXECUTION_STATE } from './TaskExecution';
import { EXECUTION_LOG_ENTRY_TYPE, EXECUTION_LOG_ENTRY_STATUS } from './ExecutionLog';

export type Input = {
  [elementId: string]: string;
};

export type Output = {
  [elementId: string]: ElementOutput
};

export type VARIABLE_SCOPE = 'LOCAL' | 'PROCESS' | null;

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
  incident?: IncidentResult;
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

export type ApiResponse<T> = {
  success: true;
  response: T;
} | {
  success: false;
  error: string;
  errorType?: string;
  status?: number | null;
  detail?: string | null;
  operationId?: string | null;
};

export type DeployResponse = ApiResponse<DeploymentResult>;
export type GetChildProcessInstancesResponse = ApiResponse<ProcessInstanceSearchQueryResult>;
export type GetProcessInstanceResponse = ApiResponse<ProcessInstanceSearchQueryResult>;
export type GetProcessInstanceElementInstancesResponse = ApiResponse<ElementInstanceSearchQueryResult>;
export type GetProcessInstanceIncidentsResponse = ApiResponse<IncidentSearchQueryResult>;
export type GetProcessInstanceJobsResponse = ApiResponse<JobSearchQueryResult>;
export type GetProcessInstanceMessageSubscriptionsResponse = ApiResponse<MessageSubscriptionSearchQueryResult>;
export type GetProcessInstanceUserTasksResponse = ApiResponse<UserTaskSearchQueryResult>;
export type GetProcessInstanceVariablesResponse = ApiResponse<VariableSearchQueryResult>;
export type StartInstanceResponse = ApiResponse<CreateProcessInstanceResult>;

export type TaskExecutionPolledResult = {
  childProcessInstancesResponse: GetChildProcessInstancesResponse;
  elementId: string;
  elementInstancesResponse: GetProcessInstanceElementInstancesResponse;
  jobsResponse: GetProcessInstanceJobsResponse;
  messageSubscriptionsResponse: GetProcessInstanceMessageSubscriptionsResponse;
  processInstanceKey: string;
  processInstanceResponse: GetProcessInstanceResponse;
  userTasksResponse: GetProcessInstanceUserTasksResponse;
  variablesResponse: GetProcessInstanceVariablesResponse;
};

export type TaskExecutionApi = {
  deploy: () => Promise<DeployResponse>;
  getChildProcessInstances: (processInstanceKey: string) => Promise<GetChildProcessInstancesResponse>;
  getProcessInstance: (processInstanceKey: string) => Promise<GetProcessInstanceResponse>;
  getProcessInstanceElementInstances: (processInstanceKey: string) => Promise<GetProcessInstanceElementInstancesResponse>;
  getProcessInstanceIncident: (processInstanceKey: string) => Promise<GetProcessInstanceIncidentsResponse>;
  getProcessInstanceJobs: (processInstanceKey: string) => Promise<GetProcessInstanceJobsResponse>;
  getProcessInstanceMessageSubscriptions: (processInstanceKey: string) => Promise<GetProcessInstanceMessageSubscriptionsResponse>;
  getProcessInstanceUserTasks: (processInstanceKey: string) => Promise<GetProcessInstanceUserTasksResponse>;
  getProcessInstanceVariables: (processInstanceKey: string) => Promise<GetProcessInstanceVariablesResponse>;
  startInstance: (processDefinitionKey: string, elementId: string, variables: { [key: string]: any }) => Promise<StartInstanceResponse>;
};

export type TaskExecutionState = typeof TASK_EXECUTION_STATE[keyof typeof TASK_EXECUTION_STATE];

export type TaskExecutionEventListeners = {
  [TASK_EXECUTION_EVENT.STATE_CHANGED]: (state: TaskExecutionState) => void;
  [TASK_EXECUTION_EVENT.DEPLOYED]: (response: DeployResponse) => void;
  [TASK_EXECUTION_EVENT.INSTANCE_STARTED]: (response: StartInstanceResponse) => void;
  [TASK_EXECUTION_EVENT.POLLED]: (result: TaskExecutionPolledResult) => void;
  [TASK_EXECUTION_EVENT.FINISHED]: (result: TaskExecutionFinishedResult) => void;
};

export type TaskExecutionSuccessResult = {
  lastPolledResult: TaskExecutionPolledResult;
  processInstanceKey: string;
  success: true;
};

export type TaskExecutionIncidentResult = {
  incident: any;
  lastPolledResult: TaskExecutionPolledResult;
  processInstanceKey: string;
  reason: typeof TASK_EXECUTION_FINISHED_REASON.INCIDENT;
  success: false;
};

export type TaskExecutionUserCancelResult = {
  lastPolledResult: TaskExecutionPolledResult | null;
  processInstanceKey: string | null;
  reason: typeof TASK_EXECUTION_FINISHED_REASON.USER_CANCEL;
  success: false;
};

export type TaskExecutionUserSelectionChangedResult = {
  lastPolledResult: TaskExecutionPolledResult | null;
  processInstanceKey: string | null;
  reason: typeof TASK_EXECUTION_FINISHED_REASON.USER_SELECTION_CHANGED;
  success: false;
};

export type TaskExecutionErrorResult = {
  error: TaskExecutionError;
  lastPolledResult: TaskExecutionPolledResult | null;
  processInstanceKey: string | null;
  reason: typeof TASK_EXECUTION_FINISHED_REASON.ERROR;
  success: false;
};

export type TaskExecutionTerminatedResult = {
  lastPolledResult: TaskExecutionPolledResult;
  processInstanceKey: string;
  reason: typeof TASK_EXECUTION_FINISHED_REASON.TERMINATED;
  success: false;
};

export type TaskExecutionFinishedResult =
  | TaskExecutionSuccessResult
  | TaskExecutionIncidentResult
  | TaskExecutionTerminatedResult
  | TaskExecutionUserCancelResult
  | TaskExecutionUserSelectionChangedResult
  | TaskExecutionErrorResult;

export type TaskExecutionError = {
  message: string;
  response?: string;
  errorType?: string;
  status?: number | null;
  detail?: string | null;
  operationId?: string | null;
};

export type ExecutionLogEntryStatus = typeof EXECUTION_LOG_ENTRY_STATUS[keyof typeof EXECUTION_LOG_ENTRY_STATUS];

export type DeployedStatusData = {
  processDefinitionId?: string;
  processDefinitionKey?: string;
  processDefinitionVersion?: number;
  deploymentKey?: string;
};

export type InstanceStartedStatusData = {
  processInstanceKey: string;
  processDefinitionId?: string;
  processDefinitionKey?: string;
};

export type CompletedStatusData = {
  processInstanceKey: string;
};

export type TerminatedStatusData = {
  processInstanceKey: string;
};

export type IncidentStatusData = {
  processInstanceKey: string;
  errorType?: string;
  errorMessage?: string;
};

export type CanceledStatusData = {
  error?: TaskExecutionError;
};

export type ExecutionLogStatusEntryData =
  | DeployedStatusData
  | InstanceStartedStatusData
  | CompletedStatusData
  | TerminatedStatusData
  | IncidentStatusData
  | CanceledStatusData;

export type ExecutionLogJobData = {
  state: string;
  type?: string;
  elementId?: string;
  kind?: string;
  listenerEventType?: string;
  jobKey?: string;
  creationTime?: string;
  endTime?: string;
};

export type ExecutionLogUserTaskData = {
  state: string;
  name?: string;
  elementId?: string;
  userTaskKey?: string;
  creationDate?: string;
  completionDate?: string;
};

export type ExecutionLogElementInstanceData = {
  type?: string;
  state: string;
  elementId?: string;
  elementName?: string;
  startDate?: string;
  endDate?: string;
  elementInstanceKey?: string;
  childProcessInstanceKey?: string;
};

export type ExecutionLogMessageSubscriptionData = {
  messageName?: string;
  elementId?: string;
  messageSubscriptionState?: string;
  messageSubscriptionKey?: string;
};

export type ExecutionLogStatusEntry = {
  type: typeof EXECUTION_LOG_ENTRY_TYPE.STATUS;
  status: ExecutionLogEntryStatus;
  data?: ExecutionLogStatusEntryData;
  timestamp: number;
};

export type ExecutionLogJobEntry = {
  type: typeof EXECUTION_LOG_ENTRY_TYPE.JOB;
  data: ExecutionLogJobData;
  timestamp: number;
};

export type ExecutionLogUserTaskEntry = {
  type: typeof EXECUTION_LOG_ENTRY_TYPE.USER_TASK;
  data: ExecutionLogUserTaskData;
  timestamp: number;
};

export type ExecutionLogMessageSubscriptionEntry = {
  type: typeof EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION;
  data: ExecutionLogMessageSubscriptionData;
  timestamp: number;
};

export type ExecutionLogElementInstanceEntry = {
  type: typeof EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE;
  data: ExecutionLogElementInstanceData;
  timestamp: number;
};

export type ExecutionLogEntry = ExecutionLogStatusEntry
  | ExecutionLogJobEntry
  | ExecutionLogUserTaskEntry
  | ExecutionLogMessageSubscriptionEntry
  | ExecutionLogElementInstanceEntry;

export type { Element, ModdleElement } from 'bpmn-js/lib/model/Types';

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

export {
  CreateProcessInstanceResult,
  DeploymentResult,
  ElementInstanceResult,
  ElementInstanceSearchQueryResult,
  IncidentResult,
  IncidentSearchQueryResult,
  JobSearchQueryResult,
  JobSearchResult,
  MessageSubscriptionResult,
  MessageSubscriptionSearchQueryResult,
  ProcessInstanceResult,
  ProcessInstanceSearchQueryResult,
  SearchQueryResponse,
  UserTaskResult,
  UserTaskSearchQueryResult,
  VariableSearchResult,
  VariableSearchQueryResult
} from '@camunda8/orchestration-cluster-api';