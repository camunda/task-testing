/**
 * @import {
 *   ApiResponse,
 *   CreateProcessInstanceResult,
 *   DeploymentResult,
 *   ElementInstanceResult,
 *   IncidentResult,
 *   JobSearchResult,
 *   MessageSubscriptionResult,
 *   SearchQueryResponse,
 *   ProcessInstanceResult,
 *   ElementInstanceSearchQueryResult,
 *   IncidentSearchQueryResult,
 *   JobSearchQueryResult,
 *   MessageSubscriptionSearchQueryResult,
 *   ProcessInstanceSearchQueryResult,
 *   UserTaskSearchQueryResult,
 *   VariableSearchQueryResult,
 *   UserTaskResult,
 *   VariableSearchResult
 * } from '../../lib/types';
 */

/**
 * Creates a mock API response.
 *
 * @returns {ApiResponse} a mock API response with the given data and status code.
 */
export function createAPIResponse(overrides = {}) {
  return {
    success: true,
    response: {},
    ...overrides
  };
}

export const DEFAULT_DEPLOYMENT_KEY = '1';
export const DEFAULT_PROCESS_DEFINITION_KEY = '2';
export const DEFAULT_PROCESS_INSTANCE_KEY = '3';

/** @type {DeploymentResult} */
export const DEFAULT_DEPLOY_RESPONSE = {
  deploymentKey: DEFAULT_DEPLOYMENT_KEY,
  tenantId: '<default>',
  deployments: [
    {
      processDefinition: {
        processDefinitionId: 'Process_1',
        processDefinitionVersion: 1,
        resourceName: 'diagram.bpmn',
        tenantId: '<default>',
        processDefinitionKey: DEFAULT_PROCESS_DEFINITION_KEY
      }
    }
  ],
  processes: [
    {
      processDefinitionId: 'Process_1',
      processDefinitionVersion: 1,
      resourceName: 'diagram.bpmn',
      tenantId: '<default>',
      processDefinitionKey: DEFAULT_PROCESS_DEFINITION_KEY
    }
  ],
  decisions: [],
  forms: [],
  decisionRequirements: []
};

/**
 * Creates a mock camunda-8-js-sdk `deployResources` response for deploying resources with the given overrides.
 *
 * @param {Partial<DeploymentResult>} overrides
 *
 * @returns {DeploymentResult}
 */
export function createDeployResourcesSDKResponse(overrides = {}) {
  return {
    ...DEFAULT_DEPLOY_RESPONSE,
    ...overrides
  };
}

/**
 * Creates a mock API response for deploying a resource with the given overrides.
 *
 * @param {Partial<ApiResponse<DeploymentResult>>} overrides
 *
 * @returns {ApiResponse<DeploymentResult>}
 */
export function createDeployResponse(overrides = {}) {
  return createAPIResponse({
    response: createDeployResourcesSDKResponse(),
    ...overrides
  });
}

export const DEFAULT_DEPLOY_ERROR = 'Response code 400 (Bad Request) (POST https://lpp-1.zeebe.dev.ultrawombat.com/1/v2/deployments). {"type":"about:blank","title":"INVALID_ARGUMENT","status":400,"detail":"Command \'CREATE\' rejected with code \'INVALID_ARGUMENT\': Expected to deploy new resources, but encountered the following errors:\\n\'diagram.bpmn\': - Element: Process_1\\n    - ERROR: Must have at least one start event\\n","instance":"/1/v2/deployments"}. Enhanced stack trace available as error.source.';

/** @type {CreateProcessInstanceResult} */
export const DEFAULT_START_INSTANCE_RESPONSE = {
  processDefinitionId: 'Process_1',
  processDefinitionVersion: 1,
  tenantId: '<default>',
  variables: {},
  processDefinitionKey: DEFAULT_PROCESS_DEFINITION_KEY,
  processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
  tags: []
};

/**
 * Creates a mock camunda-8-js-sdk `createProcessInstance` response for starting a process instance with the given overrides.
 *
 * @param {Partial<CreateProcessInstanceResult>} overrides
 *
 * @returns {CreateProcessInstanceResult}
 */
export function createCreateProcessInstanceSDKResponse(overrides = {}) {
  return {
    ...DEFAULT_START_INSTANCE_RESPONSE,
    ...overrides
  };
}

/**
 * Creates a mock API response for starting a process instance with the given overrides.
 *
 * @param {Partial<ApiResponse<CreateProcessInstanceResult>>} overrides
 *
 * @returns {ApiResponse<CreateProcessInstanceResult>}
 */
export function createStartInstanceResponse(overrides = {}) {
  return createAPIResponse({
    response: createCreateProcessInstanceSDKResponse(),
    ...overrides
  });
}

export const DEFAULT_START_INSTANCE_ERROR = 'Response code 400 (Bad Request) (POST https://lpp-1.zeebe.dev.ultrawombat.com/1/v2/process-instances). {"type":"about:blank","title":"Bad Request","status":400,"detail":"Request property [runtimeInstructions.null] cannot be parsed","instance":"/1/v2/process-instances"}. Enhanced stack trace available as error.source.';

/**
 * Creates a mock paginated search response with the given items.
 *
 * @param {Array} [ items = [] ] - The items to include in the paginated response.
 *
 * @returns {SearchQueryResponse}
 */
function createPaginatedResponse(items = []) {
  return {
    items,
    page: {
      totalItems: items.length,
      hasMoreTotalItems: false,
      startCursor: '1',
      endCursor: '2'
    }
  };
}

export const DEFAULT_DATE = '2000-01-01T12:00:00.000Z';
export const ONE_SECOND_MS = 1000;
export const ONE_MINUTE_MS = 60 * ONE_SECOND_MS;
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;

/**
 * Creates a mock date string based on the milliseconds elapsed since the default date.
 *
 * @param {number} timeElapsedMs - The number of milliseconds elapsed since the default date.
 *
 * @returns {string} A mock date string in ISO format.
 */
export function createMockDate(timeElapsedMs = 0) {
  const date = new Date(DEFAULT_DATE);

  date.setTime(date.getTime() + timeElapsedMs);

  return date.toISOString();
}

export function createMockTimestamp(timeElapsedMs = 0) {
  return new Date(createMockDate(timeElapsedMs)).getTime();
}

/** @type {ProcessInstanceResult} */
export const DEFAULT_PROCESS_INSTANCE_DETAILS = {
  processDefinitionId: 'Process_1',
  processDefinitionName: 'Process_1',
  processDefinitionVersion: 1,
  startDate: createMockDate(0),
  endDate: createMockDate(ONE_MINUTE_MS),
  state: 'TERMINATED',
  hasIncident: false,
  tenantId: '<default>',
  processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
  processDefinitionKey: DEFAULT_PROCESS_DEFINITION_KEY
};

/** @type {ProcessInstanceResult[]} */
export const DEFAULT_PROCESS_INSTANCE_ITEMS = [
  DEFAULT_PROCESS_INSTANCE_DETAILS
];

/**
 * Creates a mock process instance details object with the given overrides.
 *
 * @param {Partial<ProcessInstanceResult} overrides
 *
 * @returns {ProcessInstanceResult}
 */
export function createProcessInstanceDetails(overrides = {}) {
  return {
    ...DEFAULT_PROCESS_INSTANCE_DETAILS,
    ...overrides
  };
}

/**
 * Creates a mock camunda-8-js-sdk `searchProcessInstances` response for searching process instances with the given overrides.
 *
 * @param {Partial<ProcessInstanceResult>} overrides
 *
 * @returns {ProcessInstanceResult}
 */
export function createSearchProcessInstancesSDKResponse(overrides = {}) {
  return {
    ...createPaginatedResponse(DEFAULT_PROCESS_INSTANCE_ITEMS),
    ...overrides
  };
}

/**
 * Creates a mock API response for getting process instances with the given overrides.
 *
 * @param {Partial<ApiResponse<ProcessInstanceSearchQueryResult>>} overrides
 *
 * @returns {ApiResponse<ProcessInstanceSearchQueryResult>}
 */
export function createGetProcessInstanceResponse(overrides = {}) {
  return createAPIResponse({
    response: createSearchProcessInstancesSDKResponse(),
    ...overrides
  });
}

/**
 * Creates a mock API response for getting process instances with no process instances.
 *
 * @returns {ApiResponse<ProcessInstanceSearchQueryResult>}
 */
export function createEmptyGetProcessInstanceResponse() {
  return createAPIResponse({
    response: createSearchProcessInstancesSDKResponse({ items: [] })
  });
}

export const DEFAULT_VARIABLE_KEY = '1';
export const DEFAULT_SCOPE_KEY = DEFAULT_PROCESS_INSTANCE_KEY;

/** @type {VariableSearchResult} */
export const DEFAULT_VARIABLE = {
  value: 'bar',
  isTruncated: false,
  name: 'foo',
  tenantId: '<default>',
  variableKey: DEFAULT_VARIABLE_KEY,
  scopeKey: DEFAULT_SCOPE_KEY,
  processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY
};

export const DEFAULT_VARIABLE_ITEMS = [
  DEFAULT_VARIABLE
];

/**
 * Creates a mock variable details object with the given overrides.
 *
 * @param {Partial<VariableSearchResult>} overrides
 *
 * @returns {VariableSearchResult}
 */
export function createVariableDetails(overrides = {}) {
  return {
    ...DEFAULT_VARIABLE,
    ...overrides
  };
}

/**
 * Creates a mock camunda-8-js-sdk `searchVariables` response for searching variables with the given overrides.
 *
 * @param {Partial<VariableSearchQueryResult>} overrides
 *
 * @returns {VariableSearchQueryResult}
 */
export function createSearchVariablesSDKResponse(overrides = {}) {
  return {
    ...createPaginatedResponse(DEFAULT_VARIABLE_ITEMS),
    ...overrides
  };
}

/**
 * Creates a mock API response for getting process instance variables with the given overrides.
 *
 * @param {Partial<ApiResponse<VariableSearchQueryResult>>} overrides
 *
 * @returns {ApiResponse<VariableSearchQueryResult>}
 */
export function createGetProcessInstanceVariablesResponse(overrides = {}) {
  return createAPIResponse({
    response: createSearchVariablesSDKResponse(),
    ...overrides
  });
}

export const DEFAULT_ELEMENT_INSTANCE_KEY = '1';

/** @type {ElementInstanceResult} */
export const DEFAULT_ELEMENT_INSTANCE = {
  processDefinitionId: 'Process_1',
  startDate: createMockDate(0),
  endDate: createMockDate(ONE_MINUTE_MS),
  elementId: 'ServiceTask_1',
  elementName: 'Service Task',
  type: 'SCRIPT_TASK',
  state: 'COMPLETED',
  hasIncident: false,
  tenantId: '<default>',
  elementInstanceKey: DEFAULT_ELEMENT_INSTANCE_KEY,
  processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
  processDefinitionKey: DEFAULT_PROCESS_DEFINITION_KEY
};

/**
 * Creates a mock element instance details object with the given overrides.
 *
 * @param {Partial<ElementInstanceResult>} overrides
 *
 * @returns {ElementInstanceResult}
 */
export function createElementInstanceDetails(overrides = {}) {
  return {
    ...DEFAULT_ELEMENT_INSTANCE,
    ...overrides
  };
}

/**
 * Creates a mock camunda-8-js-sdk `searchElementInstances` response for searching element instances with the given overrides.
 *
 * @param {Partial<ElementInstanceSearchQueryResult>} overrides
 *
 * @returns {ElementInstanceSearchQueryResult}
 */
export function createSearchElementInstancesSDKResponse(overrides = {}) {
  return {
    ...createPaginatedResponse([ DEFAULT_ELEMENT_INSTANCE ]),
    ...overrides
  };
}

/**
 * Creates a mock API response for getting process instance element instances with the given overrides.
 *
 * @param {Partial<ApiResponse<ElementInstanceSearchQueryResult>>} overrides
 *
 * @returns {ApiResponse<ElementInstanceSearchQueryResult>}
 */
export function createGetProcessInstanceElementInstancesResponse(overrides = {}) {
  return createAPIResponse({
    response: createSearchElementInstancesSDKResponse(),
    ...overrides
  });
}

export const DEFAULT_JOB_KEY = '1';

/** @type {JobSearchResult} */
export const DEFAULT_JOB = {
  customHeaders: {
    foo: 'bar'
  },
  deadline: createMockDate(ONE_MINUTE_MS),
  deniedReason: '',
  elementId: 'ServiceTask_1',
  elementInstanceKey: DEFAULT_ELEMENT_INSTANCE_KEY,
  endTime: createMockDate(ONE_MINUTE_MS),
  errorCode: '',
  errorMessage: '',
  hasFailedWithRetriesLeft: false,
  isDenied: false,
  jobKey: DEFAULT_JOB_KEY,
  kind: 'BPMN_ELEMENT',
  listenerEventType: 'UNSPECIFIED',
  processDefinitionId: 'Process_1',
  processDefinitionKey: DEFAULT_PROCESS_DEFINITION_KEY,
  processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
  retries: 3,
  state: 'COMPLETED',
  tenantId: '<default>',
  type: 'foo',
  worker: '',
  creationTime: createMockDate(0), // Only available in 8.9
  lastUpdateTime: createMockDate(ONE_MINUTE_MS) // Only available in 8.9
};

/**
 * Creates a mock job details object with the given overrides.
 *
 * @param {Partial<JobSearchResult>} overrides
 *
 * @returns {JobSearchResult}
 */
export function createJobDetails(overrides = {}) {
  return {
    ...DEFAULT_JOB,
    ...overrides
  };
}

/**
 * Creates a mock camunda-8-js-sdk `searchJobs` response for searching jobs with the given overrides.
 *
 * @param {Partial<JobSearchQueryResult>} overrides
 *
 * @returns {JobSearchQueryResult}
 */
export function createSearchJobsSDKResponse(overrides = {}) {
  return {
    ...createPaginatedResponse([ DEFAULT_JOB ]),
    ...overrides
  };
}

/**
 * Creates a mock API response for getting process instance jobs with the given overrides.
 *
 * @param {Partial<ApiResponse<JobSearchQueryResult>>} overrides
 *
 * @returns {ApiResponse<JobSearchQueryResult>}
 */
export function createGetProcessInstanceJobsResponse(overrides = {}) {
  return createAPIResponse({
    response: createSearchJobsSDKResponse(),
    ...overrides
  });
}

/**
 * Creates a mock API response for getting process instance jobs with no jobs.
 *
 * @returns {ApiResponse<JobSearchQueryResult>}
 */
export function createEmptyGetProcessInstanceJobsResponse() {
  return createAPIResponse({
    response: createSearchJobsSDKResponse({ items: [] })
  });
}

export const DEFAULT_MESSAGE_SUBSCRIPTION_KEY = '1';

/** @type {MessageSubscriptionResult} */
export const DEFAULT_MESSAGE_SUBSCRIPTION = {
  messageSubscriptionKey: DEFAULT_MESSAGE_SUBSCRIPTION_KEY,
  processDefinitionId: 'Process_1',
  processDefinitionKey: DEFAULT_PROCESS_DEFINITION_KEY,
  processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
  elementId: 'ServiceTask_1',
  elementInstanceKey: DEFAULT_ELEMENT_INSTANCE_KEY,
  messageSubscriptionState: 'CORRELATED',
  lastUpdatedDate: createMockDate(ONE_MINUTE_MS),
  messageName: 'Message_1',
  correlationKey: 'foo',
  tenantId: '<default>'
};

/**
 * Creates a mock message subscription details object with the given overrides.
 *
 * @param {Partial<MessageSubscriptionResult>} overrides
 *
 * @returns {MessageSubscriptionResult}
 */
export function createMessageSubscriptionDetails(overrides = {}) {
  return {
    ...DEFAULT_MESSAGE_SUBSCRIPTION,
    ...overrides
  };
}

/**
 * Creates a mock camunda-8-js-sdk `searchMessageSubscriptions` response for searching message subscriptions with the given overrides.
 *
 * @param {Partial<MessageSubscriptionSearchQueryResult>} overrides
 *
 * @returns {MessageSubscriptionSearchQueryResult}
 */
export function createSearchMessageSubscriptionsSDKResponse(overrides = {}) {
  return {
    ...createPaginatedResponse([ DEFAULT_MESSAGE_SUBSCRIPTION ]),
    ...overrides
  };
}

/**
 * Creates a mock API response for getting process instance message subscriptions with the given overrides.
 *
 * @param {Partial<ApiResponse<MessageSubscriptionSearchQueryResult>>} overrides
 *
 * @returns {ApiResponse<MessageSubscriptionSearchQueryResult>}
 */
export function createGetProcessInstanceMessageSubscriptionsResponse(overrides = {}) {
  return createAPIResponse({
    response: createSearchMessageSubscriptionsSDKResponse(),
    ...overrides
  });
}

/**
 * Creates a mock API response for getting process instance message subscriptions with no message subscriptions.
 *
 * @returns {ApiResponse<MessageSubscriptionSearchQueryResult>}
 */
export function createEmptyGetProcessInstanceMessageSubscriptionsResponse() {
  return createAPIResponse({
    response: createSearchMessageSubscriptionsSDKResponse({ items: [] })
  });
}

export const DEFAULT_USER_TASK_KEY = '1';
export const DEFAULT_FORM_KEY = 'form-1';

/** @type {UserTaskResult} */
export const DEFAULT_USER_TASK = {
  name: 'string',
  state: 'COMPLETED',
  assignee: 'string',
  elementId: 'UserTask_1',
  candidateGroups: [
    'foo'
  ],
  candidateUsers: [
    'bar'
  ],
  processDefinitionId: 'Process_1',
  creationDate: createMockDate(0),
  completionDate: createMockDate(ONE_MINUTE_MS),
  followUpDate: createMockDate(ONE_MINUTE_MS),
  dueDate: createMockDate(ONE_MINUTE_MS),
  tenantId: '<default>',
  externalFormReference: '',
  processDefinitionVersion: 0,
  customHeaders: {},
  priority: 50,
  userTaskKey: DEFAULT_USER_TASK_KEY,
  elementInstanceKey: DEFAULT_ELEMENT_INSTANCE_KEY,
  processName: 'Process_1',
  processDefinitionKey: DEFAULT_PROCESS_DEFINITION_KEY,
  processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
  rootProcessInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
  formKey: DEFAULT_FORM_KEY,
  tags: [
    'foo',
    'bar'
  ]
};

/**
 * Creates a mock user task details object with the given overrides.
 *
 * @param {Partial<UserTaskResult>} overrides
 *
 * @returns {UserTaskResult}
 */
export function createUserTaskDetails(overrides = {}) {
  return {
    ...DEFAULT_USER_TASK,
    ...overrides
  };
}

/**
 * Creates a mock camunda-8-js-sdk `searchUserTasks` response for searching user tasks with the given overrides.
 *
 * @param {Partial<UserTaskSearchQueryResult>} overrides
 *
 * @returns {UserTaskSearchQueryResult}
 */
export function createSearchUserTasksSDKResponse(overrides = {}) {
  return {
    ...createPaginatedResponse([ DEFAULT_USER_TASK ]),
    ...overrides
  };
}

/**
 * Creates a mock API response for getting process instance user tasks with the given overrides.
 *
 * @param {Partial<ApiResponse<UserTaskSearchQueryResult>>} overrides
 *
 * @returns {ApiResponse<UserTaskSearchQueryResult>}
 */
export function createGetProcessInstanceUserTasksResponse(overrides = {}) {
  return createAPIResponse({
    response: createSearchUserTasksSDKResponse(),
    ...overrides
  });
}

/**
 * Creates a mock API response for getting process instance user tasks with no user tasks.
 *
 * @returns {ApiResponse<UserTaskSearchQueryResult>}
 */
export function createEmptyGetProcessInstanceUserTasksResponse() {
  return createAPIResponse({
    response: createSearchUserTasksSDKResponse({ items: [] })
  });
}

export const DEFAULT_INCIDENT_KEY = '1';

/** @type {IncidentResult} */
export const DEFAULT_INCIDENT = {
  processDefinitionId: 'Process_1',
  errorType: 'JOB_NO_RETRIES',
  errorMessage: 'foo',
  elementId: 'ServiceTask_1',
  creationTime: createMockDate(0),
  state: 'ACTIVE',
  tenantId: '<default>',
  incidentKey: DEFAULT_INCIDENT_KEY,
  processDefinitionKey: DEFAULT_PROCESS_DEFINITION_KEY,
  processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
  elementInstanceKey: DEFAULT_ELEMENT_INSTANCE_KEY,
  jobKey: DEFAULT_JOB_KEY
};

/**
 * Creates a mock incident details object with the given overrides.
 *
 * @param {Partial<IncidentResult>} overrides
 *
 * @returns {IncidentResult}
 */
export function createIncidentDetails(overrides = {}) {
  return {
    ...DEFAULT_INCIDENT,
    ...overrides
  };
}

/**
 * Creates a mock camunda-8-js-sdk `searchIncidents` response for searching incidents with the given overrides.
 *
 * @param {Partial<IncidentSearchQueryResult>} overrides
 *
 * @returns {IncidentSearchQueryResult}
 */
export function createSearchIncidentSDKResponse(overrides = {}) {
  return {
    ...createPaginatedResponse([ DEFAULT_INCIDENT ]),
    ...overrides
  };
}

/**
 * Creates a mock API response for getting process instance incidents with the given overrides.
 *
 * @param {Partial<ApiResponse<IncidentSearchQueryResult>>} overrides
 *
 * @returns {ApiResponse<IncidentSearchQueryResult>}
 */
export function createGetProcessInstanceIncidentResponse(overrides = {}) {
  return createAPIResponse({
    response: createSearchIncidentSDKResponse(),
    ...overrides
  });
}