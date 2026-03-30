/**
 * @import {Injector} from 'didi';
 *
 * @import {
 *   DeployResponse,
 *   ElementInstanceResult,
 *   ExecutionLogEntry,
 *   ExecutionLogElementInstanceEntry,
 *   ExecutionLogEntryStatus,
 *   ExecutionLogJobEntry,
 *   ExecutionLogMessageSubscriptionEntry,
 *   ExecutionLogStatusEntry,
 *   ExecutionLogUserTaskEntry,
 *   ExecutionLogJobData,
 *   ExecutionLogUserTaskData,
 *   ExecutionLogElementInstanceData,
 *   ExecutionLogMessageSubscriptionData,
 *   JobSearchResult,
 *   MessageSubscriptionResult,
 *   StartInstanceResponse,
 *   TaskExecutionFinishedResult,
 *   TaskExecutionPolledResult,
 *   TaskExecutionState,
 *   UserTaskResult
 * } from './types';
 */

export const EXECUTION_LOG_ENTRY_TYPE = /** @type {const} */ ({
  STATUS: 'status',
  JOB: 'job',
  USER_TASK: 'user-task',
  MESSAGE_SUBSCRIPTION: 'message-subscription',
  ELEMENT_INSTANCE: 'element-instance'
});

export const EXECUTION_LOG_ENTRY_STATUS = /** @type {const} */ ({
  DEPLOYING: 'deploying',
  DEPLOYED: 'deployed',
  STARTING_INSTANCE: 'starting-instance',
  INSTANCE_STARTED: 'instance-started',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  INCIDENT: 'incident',
  TERMINATED: 'terminated',
  CANCELED: 'canceled'
});

/**
 * Named orders representing the causal order of execution log entries. Lower
 * values are earlier in the lifecycle. Used by {@link getEntryOrder} to assign
 * an order to each entry so that entries sharing a timestamp can be placed in a
 * causally correct sequence.
 */
export const ENTRY_ORDER = /** @type {const} */ ({
  DEPLOYED: 0,
  INSTANCE_STARTED: 1,
  ELEMENT_ACTIVE: 2,
  START_LISTENER_CREATED: 3,
  START_LISTENER_TERMINAL: 4,
  WORK_CREATED: 5,
  WORK_TERMINAL: 6,
  END_LISTENER_CREATED: 7,
  END_LISTENER_TERMINAL: 8,
  ELEMENT_TERMINAL: 9,
  STATUS_TERMINAL: 10
});

/**
 * Parse a date string into a millisecond timestamp.
 *
 * @param {string} [dateString]
 *
 * @returns {number|null}
 */
function toTimestamp(dateString) {
  if (!dateString) return null;

  const ms = new Date(dateString).getTime();

  return isNaN(ms) ? null : ms;
}

/**
 * Extract only the UI-needed fields from a raw job API item.
 *
 * @param {JobSearchResult} item
 * @param {Partial<ExecutionLogJobData>} [overrides]
 *
 * @returns {ExecutionLogJobData}
 */
function pickJobData(item, overrides) {
  return {
    state: item.state,
    type: item.type,
    elementId: item.elementId,
    kind: item.kind,
    listenerEventType: item.listenerEventType,
    jobKey: item.jobKey,
    creationTime: /** @type {string | undefined} */ (/** @type {any} */ (item).creationTime),
    endTime: item.endTime,
    ...overrides
  };
}

/**
 * Extract only the UI-needed fields from a raw user task API item.
 *
 * @param {UserTaskResult} item
 * @param {Partial<ExecutionLogUserTaskData>} [overrides]
 *
 * @returns {ExecutionLogUserTaskData}
 */
function pickUserTaskData(item, overrides) {
  return {
    state: item.state || '',
    name: item.name,
    elementId: item.elementId,
    userTaskKey: item.userTaskKey,
    creationDate: item.creationDate,
    completionDate: item.completionDate,
    ...overrides
  };
}

/**
 * Extract only the UI-needed fields from a raw element instance API item.
 *
 * @param {ElementInstanceResult} item
 * @param {Partial<ExecutionLogElementInstanceData>} [overrides]
 *
 * @returns {ExecutionLogElementInstanceData}
 */
function pickElementInstanceData(item, overrides) {
  return {
    type: item.type,
    state: item.state,
    elementId: item.elementId,
    elementName: item.elementName,
    startDate: item.startDate,
    endDate: item.endDate,
    elementInstanceKey: item.elementInstanceKey,
    ...overrides
  };
}

/**
 * Extract only the UI-needed fields from a raw message subscription API item.
 *
 * @param {MessageSubscriptionResult} item
 * @param {Partial<ExecutionLogMessageSubscriptionData>} [overrides]
 *
 * @returns {ExecutionLogMessageSubscriptionData}
 */
function pickMessageSubscriptionData(item, overrides) {
  return {
    messageName: item.messageName,
    elementId: item.elementId,
    messageSubscriptionState: item.messageSubscriptionState,
    messageSubscriptionKey: item.messageSubscriptionKey,
    ...overrides
  };
}

export function createJobEntry(item, timestamp, overrides) {
  return {
    type: EXECUTION_LOG_ENTRY_TYPE.JOB,
    data: pickJobData(item, overrides),
    timestamp
  };
}

/**
 * Create log entries from job items. When a job has both a creation time
 * (present for jobs created after 8.9) and an end time, two entries are
 * produced - one for when the job was created and one for when it reached its
 * final state (completed, failed, etc.). When a job has no creation time, the
 * matching element instance's startDate is used as a best approximation.
 *
 * @param {JobSearchResult[]} jobs
 * @param {ElementInstanceResult[]} elementInstances
 * @param {number} fallbackTimestamp
 *
 * @returns {ExecutionLogJobEntry[]}
 */
export function createJobEntries(jobs, elementInstances, fallbackTimestamp) {
  const entries = [];

  for (const job of jobs) {
    let createdAt = toTimestamp(/** @type {any} */ (job).creationTime);

    // Resolve creation timestamp from the matching element instance's
    // startDate when the job has no creationTime (pre-8.9).
    if (!createdAt && job.elementInstanceKey && elementInstances) {
      const elementInstance = elementInstances.find(
        elementInstance => elementInstance.elementInstanceKey === job.elementInstanceKey
      );

      if (elementInstance?.startDate) {
        const ms = new Date(elementInstance.startDate).getTime();

        if (!isNaN(ms)) {
          createdAt = ms;
        }
      }
    }

    entries.push(createJobEntry(job, createdAt || fallbackTimestamp, { state: 'CREATED' }));

    if (job.state === 'CREATED') {
      continue;
    }

    const endedAt = toTimestamp(job.endTime);

    entries.push(createJobEntry(job, endedAt || fallbackTimestamp, { state: job.state }));
  }

  return entries;
}

/**
 * Create log entries from user task items. When a task has both a creation date
 * and a completion date, two entries are produced — one for when the task was
 * created and one for when it was completed.
 *
 * @param {UserTaskResult[]} userTasks
 * @param {number} fallbackTimestamp
 *
 * @returns {ExecutionLogUserTaskEntry[]}
 */
export function createUserTaskEntries(userTasks, fallbackTimestamp) {
  const entries = [];

  for (const task of userTasks) {
    const createdAt = toTimestamp(task.creationDate);

    entries.push({
      type: EXECUTION_LOG_ENTRY_TYPE.USER_TASK,
      data: pickUserTaskData(task, { state: 'CREATED' }),
      timestamp: createdAt || fallbackTimestamp
    });

    if (task.state === 'CREATED') {
      continue;
    }

    const completedAt = toTimestamp(task.completionDate);

    entries.push({
      type: EXECUTION_LOG_ENTRY_TYPE.USER_TASK,
      data: pickUserTaskData(task),
      timestamp: completedAt || fallbackTimestamp
    });
  }

  return entries;
}

/**
 * Create log entries from element instance items. When an instance has both a
 * start date and an end date, two entries are produced — one for when the
 * instance became active and one for when it completed.
 *
 * @param {ElementInstanceResult[]} instances
 * @param {number} fallbackTimestamp
 *
 * @returns {ExecutionLogElementInstanceEntry[]}
 */
export function createElementInstanceEntries(instances, fallbackTimestamp) {
  const entries = [];

  for (const instance of instances) {
    const startedAt = toTimestamp(instance.startDate);

    entries.push({
      type: EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE,
      data: pickElementInstanceData(instance, { state: 'ACTIVE' }),
      timestamp: startedAt || fallbackTimestamp
    });

    if (instance.state === 'ACTIVE') {
      continue;
    }

    const endedAt = toTimestamp(instance.endDate);

    entries.push({
      type: EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE,
      data: pickElementInstanceData(instance),
      timestamp: endedAt || fallbackTimestamp
    });
  }

  return entries;
}

/**
 * Create log entries for message subscriptions. Timestamps are resolved from
 * the matching element instance's startDate, since message subscriptions are
 * created when their element is entered. Falls back to the poll timestamp
 * when no matching element instance is found.
 *
 * @param {any[]} subscriptions
 * @param {any[]} elementInstances
 * @param {number} fallbackTimestamp
 *
 * @returns {ExecutionLogMessageSubscriptionEntry[]}
 */
export function createMessageSubscriptionEntries(subscriptions, elementInstances, fallbackTimestamp) {
  const entries = [];

  for (const subscription of subscriptions) {
    let createdTimestamp = fallbackTimestamp;
    let correlatedTimestamp = fallbackTimestamp;

    // Resolve timestamps from the matching element instance's startDate and
    // endDate when the subscription has an elementInstanceKey and matching
    // element instance is found.
    if (subscription.elementInstanceKey && elementInstances) {
      const elementInstance = elementInstances.find(
        elementInstance => elementInstance.elementInstanceKey === subscription.elementInstanceKey
      );

      if (elementInstance?.startDate) {
        const ms = new Date(elementInstance.startDate).getTime();

        if (!isNaN(ms)) {
          createdTimestamp = ms;
        }
      }

      if (elementInstance?.endDate && subscription.messageSubscriptionState === 'CORRELATED') {
        const ms = new Date(elementInstance.endDate).getTime();

        if (!isNaN(ms)) {
          correlatedTimestamp = ms;
        }
      }
    }

    entries.push({
      type: EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION,
      data: pickMessageSubscriptionData(subscription, { messageSubscriptionState: 'CREATED' }),
      timestamp: createdTimestamp
    });

    if (subscription.messageSubscriptionState === 'CORRELATED') {
      entries.push({
        type: EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION,
        data: pickMessageSubscriptionData(subscription),
        timestamp: correlatedTimestamp
      });
    }
  }

  return entries;
}

/**
 * Create a status entry from a finished execution result.
 *
 * @param {TaskExecutionFinishedResult} result
 * @param {number} timestamp
 *
 * @returns {ExecutionLogStatusEntry}
 */
export function createFinishedStatusEntry(result, timestamp) {
  if (result.success) {
    return {
      type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
      status: 'completed',
      data: { processInstanceKey: result.processInstanceKey },
      timestamp
    };
  }

  switch (result.reason) {
  case 'incident':
    return {
      type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
      status: 'incident',
      data: {
        processInstanceKey: result.processInstanceKey,
        errorType: result.incident?.errorType,
        errorMessage: result.incident?.errorMessage
      },
      timestamp
    };
  case 'terminated':
    return {
      type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
      status: 'terminated',
      data: { processInstanceKey: result.processInstanceKey },
      timestamp
    };
  case 'user.cancel':
  case 'user.selectionChanged':
  case 'error':
  default:
    return {
      type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
      status: 'canceled',
      data: 'error' in result ? { error: result.error } : undefined,
      timestamp
    };
  }
}

/**
 * Format an element type for display (e.g. SERVICE_TASK → "Service Task").
 *
 * @param {string} type
 *
 * @returns {string}
 */
export function formatElementType(type) {
  return (type || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Determine the {@link ENTRY_ORDER} for an execution log entry so that entries
 * are placed in a causally correct sequence. Status entries (deployed,
 * instance-started, terminal) are always pinned to their canonical position
 * regardless of timestamp. For all other entries the order is used as a
 * tiebreaker when timestamps are equal.
 *
 * Entry order mapping (lower = earlier in the lifecycle):
 *   ENTRY_ORDER.DEPLOYED                – deployed status
 *   ENTRY_ORDER.INSTANCE_STARTED        – instance-started status
 *   ENTRY_ORDER.ELEMENT_ACTIVE          – element-instance ACTIVE
 *   ENTRY_ORDER.START_LISTENER_CREATED  – start execution listener job CREATED
 *   ENTRY_ORDER.START_LISTENER_TERMINAL – start execution listener job terminal
 *   ENTRY_ORDER.WORK_CREATED            – regular job / user-task / message-subscription CREATED
 *   ENTRY_ORDER.WORK_TERMINAL           – regular job / user-task / message-subscription terminal
 *   ENTRY_ORDER.END_LISTENER_CREATED    – end execution listener job CREATED
 *   ENTRY_ORDER.END_LISTENER_TERMINAL   – end execution listener job terminal
 *   ENTRY_ORDER.ELEMENT_TERMINAL        – element-instance terminal (COMPLETED, TERMINATED, …)
 *   ENTRY_ORDER.STATUS_TERMINAL         – terminal status entries (completed, incident, …)
 *
 * @param {ExecutionLogEntry} entry
 *
 * @returns {number}
 */
export function getEntryOrder(entry) {
  if (entry.type === EXECUTION_LOG_ENTRY_TYPE.STATUS) {
    if (entry.status === EXECUTION_LOG_ENTRY_STATUS.DEPLOYED) {
      return ENTRY_ORDER.DEPLOYED;
    }

    if (entry.status === EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED) {
      return ENTRY_ORDER.INSTANCE_STARTED;
    }

    return ENTRY_ORDER.STATUS_TERMINAL;
  }

  if (entry.type === EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE) {
    return entry.data.state === 'ACTIVE' ? ENTRY_ORDER.ELEMENT_ACTIVE : ENTRY_ORDER.ELEMENT_TERMINAL;
  }

  if (entry.type === EXECUTION_LOG_ENTRY_TYPE.JOB) {
    const isListener = entry.data.kind === 'EXECUTION_LISTENER';

    if (isListener && entry.data.listenerEventType === 'START') {
      return entry.data.state === 'CREATED' ? ENTRY_ORDER.START_LISTENER_CREATED : ENTRY_ORDER.START_LISTENER_TERMINAL;
    }

    if (isListener && entry.data.listenerEventType === 'END') {
      return entry.data.state === 'CREATED' ? ENTRY_ORDER.END_LISTENER_CREATED : ENTRY_ORDER.END_LISTENER_TERMINAL;
    }

    return entry.data.state === 'CREATED' ? ENTRY_ORDER.WORK_CREATED : ENTRY_ORDER.WORK_TERMINAL;
  }

  if (entry.type === EXECUTION_LOG_ENTRY_TYPE.USER_TASK) {
    return entry.data.state === 'CREATED' ? ENTRY_ORDER.WORK_CREATED : ENTRY_ORDER.WORK_TERMINAL;
  }

  if (entry.type === EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION) {
    return entry.data.messageSubscriptionState === 'CREATED' ? ENTRY_ORDER.WORK_CREATED : ENTRY_ORDER.WORK_TERMINAL;
  }

  return ENTRY_ORDER.WORK_TERMINAL;
}

/**
 * Check whether two execution log entries are causally related and should
 * therefore be ordered by {@link ENTRY_ORDER} when they share a timestamp.
 *
 * Runtime entries are considered related when they share an `elementId`
 * (linking element-instance, job, and message-subscription entries for the
 * same BPMN element) or, for same-type entries without a common `elementId`,
 * when they share an identity key (`jobKey`, `userTaskKey`, or
 * `messageSubscriptionKey`).
 *
 * @param {ExecutionLogEntry} a
 * @param {ExecutionLogEntry} b
 *
 * @returns {boolean}
 */
export function areEntriesRelated(a, b) {
  const elementIdA = /** @type {{ elementId?: string }} */ (a.data)?.elementId;
  const elementIdB = /** @type {{ elementId?: string }} */ (b.data)?.elementId;

  if (elementIdA && elementIdB) {
    return elementIdA === elementIdB;
  }

  if (a.type === b.type) {
    if (a.type === EXECUTION_LOG_ENTRY_TYPE.JOB) {
      const aData = /** @type {ExecutionLogJobData} */ (a.data);
      const bData = /** @type {ExecutionLogJobData} */ (b.data);

      return !!(aData?.jobKey && aData.jobKey === bData?.jobKey);
    }

    if (a.type === EXECUTION_LOG_ENTRY_TYPE.USER_TASK) {
      const aData = /** @type {ExecutionLogUserTaskData} */ (a.data);
      const bData = /** @type {ExecutionLogUserTaskData} */ (b.data);

      return !!(aData?.userTaskKey && aData.userTaskKey === bData?.userTaskKey);
    }

    if (a.type === EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION) {
      const aData = /** @type {ExecutionLogMessageSubscriptionData} */ (a.data);
      const bData = /** @type {ExecutionLogMessageSubscriptionData} */ (b.data);

      return !!(aData?.messageSubscriptionKey &&
        aData.messageSubscriptionKey === bData?.messageSubscriptionKey);
    }
  }

  return false;
}

/**
 * Compare two entries by timestamp (ascending).
 *
 * @param {ExecutionLogEntry} a
 * @param {ExecutionLogEntry} b
 *
 * @returns {number}
 */
export function compareEntryTimestamps(a, b) {
  return a.timestamp - b.timestamp;
}

/**
 * Check whether two entries have the same timestamp.
 *
 * @param {ExecutionLogEntry} a
 * @param {ExecutionLogEntry} b
 *
 * @returns {boolean}
 */
export function areEntryTimestampsEqual(a, b) {
  return a.timestamp === b.timestamp;
}

/**
 * Compare two entries by their causal {@link ENTRY_ORDER} (ascending).
 *
 * @param {ExecutionLogEntry} a
 * @param {ExecutionLogEntry} b
 *
 * @returns {number}
 */
export function compareEntryOrders(a, b) {
  return getEntryOrder(a) - getEntryOrder(b);
}

export default class ExecutionLog {

  /**
   * @param {Injector} [injector]
   */
  constructor(injector) {

    /** @type {{ type: TaskExecutionState, timestamp: number }|null} */
    this._state = null;

    /** @type {{ response: DeployResponse, timestamp: number }|null} */
    this._deployResponse = null;

    /** @type {{ response: StartInstanceResponse, timestamp: number }|null} */
    this._startInstanceResponse = null;

    /** @type {{
     *   result: TaskExecutionPolledResult;
     *   timestamp: number;
     * }|null} */
    this._polledResult = null;

    /** @type {{
     *   result: TaskExecutionFinishedResult;
     *   timestamp: number;
     * }|null} */
    this._finishedResult = null;

    /** @type {ExecutionLogEntry[]} */
    this._entries = [];

    /** @type {Object|null} */
    this._elementRegistry = injector?.get?.('elementRegistry') || null;
  }

  /**
   * Set state.
   *
   * @param {TaskExecutionState} state
   * @param {number} [timestamp]
   */
  setState(state, timestamp = Date.now()) {
    this._state = { type: state, timestamp };

    this._updateEntries();
  }

  /**
   * Set deploy response.
   *
   * @param {DeployResponse} deployResponse
   * @param {number} [timestamp]
   */
  setDeployResponse(deployResponse, timestamp = Date.now()) {
    this._deployResponse = { response: deployResponse, timestamp };

    this._updateEntries();
  }

  /**
   * Set start instance response.
   *
   * @param {StartInstanceResponse} startInstanceResponse
   * @param {number} [timestamp]
   */
  setStartInstanceResponse(startInstanceResponse, timestamp = Date.now()) {
    this._startInstanceResponse = { response: startInstanceResponse, timestamp };

    this._updateEntries();
  }

  /**
   * Set poll result.
   *
   * @param {TaskExecutionPolledResult} result
   * @param {number} [timestamp]
   */
  setPolledResult(result, timestamp = Date.now()) {
    this._polledResult = {
      result,
      timestamp
    };

    this._updateEntries();
  }

  /**
   * Set finished result.
   *
   * @param {TaskExecutionFinishedResult} result
   * @param {number} [timestamp]
   */
  setFinishedResult(result, timestamp = Date.now()) {
    this._finishedResult = {
      result,
      timestamp
    };

    this._updateEntries();
  }

  /**
   * @returns {ExecutionLogEntry[]}
   */
  getEntries() {
    return this._entries;
  }

  /**
   * Clear all data and entries.
   */
  reset() {
    this._state = null;
    this._deployResponse = null;
    this._startInstanceResponse = null;
    this._polledResult = null;
    this._finishedResult = null;
    this._entries = [];
  }

  /**
   * Build the full list of log entries from all available data. Entries are
   * compiled from deploy/start-instance responses, polled result items (jobs,
   * user tasks, element instances, message subscriptions), the finished result,
   * and the ephemeral execution state. All entries are sorted chronologically.
   */
  _updateEntries() {
    const entries = [];

    // 1. Deploy response → 'deployed' status entry
    if (this._deployResponse) {
      const response = this._deployResponse.response;

      let data;

      if (response.success !== false) {
        const deployRes = response.response || response;
        const deployment = deployRes.deployments?.[0];
        const processDef = deployment && 'processDefinition' in deployment
          ? deployment.processDefinition
          : undefined;

        data = {
          processDefinitionId: processDef?.processDefinitionId,
          processDefinitionKey: processDef?.processDefinitionKey,
          processDefinitionVersion: processDef?.processDefinitionVersion,
          deploymentKey: deployRes.deploymentKey
        };
      }

      entries.push({
        type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
        status: EXECUTION_LOG_ENTRY_STATUS.DEPLOYED,
        data,
        timestamp: this._deployResponse.timestamp
      });
    }

    // 2. Start instance response → 'instance-started' status entry
    if (this._startInstanceResponse) {
      const response = this._startInstanceResponse.response;

      let data;

      if (response.success !== false) {
        const startRes = response.response || response;

        data = {
          processInstanceKey: startRes.processInstanceKey,
          processDefinitionId: startRes.processDefinitionId,
          processDefinitionKey: startRes.processDefinitionKey
        };
      }

      entries.push({
        type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
        status: EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED,
        data,
        timestamp: this._startInstanceResponse.timestamp
      });
    }

    // 3. Polled result → job, user-task, element-instance, message-subscription
    // entries
    if (this._polledResult) {
      const { result, timestamp } = this._polledResult;

      // Extract element instances first — also needed for message subscription
      // timestamp resolution since message subscriptions don't carry their own
      // timestamp, but are created when their element instance is entered
      let elementInstances = [];

      if (result.elementInstancesResponse?.success) {
        elementInstances = result.elementInstancesResponse.response.items || [];

        entries.push(
          ...createElementInstanceEntries(elementInstances, timestamp)
        );
      }

      if (result.jobsResponse?.success) {
        const jobs = result.jobsResponse.response.items || [];

        entries.push(
          ...createJobEntries(jobs, elementInstances, timestamp)
        );
      }

      if (result.userTasksResponse?.success) {
        const userTasks = result.userTasksResponse.response.items || [];

        entries.push(
          ...createUserTaskEntries(userTasks, timestamp)
        );
      }

      if (result.messageSubscriptionsResponse?.success) {
        const subscriptions = result.messageSubscriptionsResponse.response.items || [];

        entries.push(
          ...createMessageSubscriptionEntries(subscriptions, elementInstances, timestamp)
        );
      }
    }

    // 4. Finished result → completed/incident/terminated/canceled status entry
    if (this._finishedResult) {
      const { result, timestamp } = this._finishedResult;

      entries.push(createFinishedStatusEntry(result, timestamp));
    }

    // 5. Ephemeral state, only included when it represents the current state of
    // the execution (e.g. 'deploying', 'starting-instance', 'executing') and
    // isn't superseded by a more recent response (e.g. deploy response, start
    // instance response, polled result, finished result)
    if (this._state) {
      const includeState =
        (this._state.type === 'deploying' && !this._deployResponse) ||
        (this._state.type === 'starting-instance' && !this._startInstanceResponse) ||
        (this._state.type === 'executing' && !this._polledResult && !this._finishedResult);

      if (includeState) {
        entries.push({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: /** @type {ExecutionLogEntryStatus} */ (this._state.type),
          timestamp: this._state.timestamp
        });
      }
    }

    // 6. Sort chronologically, with causal tiebreaking for equal timestamps.
    // Status entries (deployed, instance-started, terminal) are always pinned
    // to their canonical position regardless of timestamp, because engine
    // timestamps can arrive slightly out of causal order. Insertion index is
    // used as a deterministic final tiebreaker to guarantee a strict total
    // order.
    this._entries = entries
      .map((entry, index) => /** @type {[number, ExecutionLogEntry]} */ ([ index, entry ]))
      .sort(([ indexA, entryA ], [ indexB, entryB ]) => {
        if (isStatusEntry(entryA) || isStatusEntry(entryB)) {
          return compareEntryOrders(entryA, entryB);
        } else if (!areEntryTimestampsEqual(entryA, entryB)) {
          return compareEntryTimestamps(entryA, entryB);
        } else if (areEntriesRelated(entryA, entryB)) {
          return compareEntryOrders(entryA, entryB);
        }

        return indexA - indexB;
      })
      .map(([ , entry ]) => entry);
  }
}

function isStatusEntry(entry) {
  return entry.type === EXECUTION_LOG_ENTRY_TYPE.STATUS;
}