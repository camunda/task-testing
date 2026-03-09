/**
 * @import {
 *   ExecutionLogEntry
 * } from '../../types';
 */

import React, { useState } from 'react';

import {
  ChevronRight,
  ChevronDown,
  Email,
  Launch,
  TaskComplete
} from '@carbon/icons-react';

import { Link } from '@carbon/react';

import classNames from 'classnames';

import {
  EXECUTION_LOG_ENTRY_STATUS,
  EXECUTION_LOG_ENTRY_TYPE,
  formatElementType,
} from '../../ExecutionLog';

import { getTasklistUrl } from '../../utils/getTasklistUrl';

const STATUS_LABELS = {
  deploying: 'Deploying process',
  deployed: 'Process deployed',
  'starting-instance': 'Starting process instance',
  'instance-started': 'Process instance started',
  executing: null,
  completed: 'Process instance completed',
  terminated: 'Process instance terminated',
  incident: 'Incident',
  canceled: 'Test canceled'
};

export const JOB_STATES = /** @type {const} */ ({
  CANCELED: 'CANCELED',
  COMPLETED: 'COMPLETED',
  CREATED: 'CREATED',
  ERROR_THROWN: 'ERROR_THROWN',
  FAILED: 'FAILED',
  MIGRATED: 'MIGRATED',
  RETRIES_UPDATED: 'RETRIES_UPDATED',
  TIMED_OUT: 'TIMED_OUT'
});

const USER_TASK_STATES = /** @type {const} */ ({
  CREATED: 'CREATED',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED'
});

function getJobLabel(data) {
  if (data.state === JOB_STATES.CANCELED) {
    return 'Job canceled';
  } else if (data.state === JOB_STATES.COMPLETED) {
    return 'Job completed';
  } else if (data.state === JOB_STATES.CREATED) {
    return 'Job created';
  } else if (data.state === JOB_STATES.ERROR_THROWN) {
    return 'Job threw an error';
  } else if (data.state === JOB_STATES.FAILED) {
    return 'Job failed';
  } else if (data.state === JOB_STATES.MIGRATED) {
    return 'Job migrated';
  } else if (data.state === JOB_STATES.RETRIES_UPDATED) {
    return 'Job retries updated';
  } else if (data.state === JOB_STATES.TIMED_OUT) {
    return 'Job timed out';
  }
}

function getUserTaskLabel(data) {
  if (data.state === USER_TASK_STATES.COMPLETED) {
    return 'User task completed';
  } else if (data.state === USER_TASK_STATES.CANCELED) {
    return 'User task canceled';
  } else if (data.state === USER_TASK_STATES.CREATED) {
    return 'User task created';
  }
}

function getMessageSubscriptionLabel(data) {
  if (data.messageSubscriptionState === 'CREATED') {
    return 'Message subscription created';
  } else if (data.messageSubscriptionState === 'CORRELATED') {
    return 'Message correlated';
  } else if (data.messageSubscriptionState === 'CANCELED') {
    return 'Message subscription canceled';
  }
}

const ELEMENT_INSTANCE_STATES = /** @type {const} */ ({
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  TERMINATED: 'TERMINATED',
  MIGRATED: 'MIGRATED'
});

function getElementInstanceLabel(data) {
  const { type, state } = data;

  if (type === 'BOUNDARY_EVENT') {
    return state === ELEMENT_INSTANCE_STATES.ACTIVE
      ? 'Boundary event triggered'
      : 'Boundary event completed';
  }

  if (type === 'EVENT_SUB_PROCESS') {
    return state === ELEMENT_INSTANCE_STATES.ACTIVE
      ? 'Event sub-process triggered'
      : 'Event sub-process completed';
  }

  const formattedType = formatElementType(type);

  if (state === ELEMENT_INSTANCE_STATES.ACTIVE) {
    return `${formattedType} activated`;
  }

  return `${formattedType} completed`;
}

function getEntrySecondaryLabel(entry) {
  switch (entry.type) {
  case EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE:
    return entry.data?.elementName || entry.data?.elementId || null;
  case EXECUTION_LOG_ENTRY_TYPE.JOB:
    return entry.data?.type || null;
  case EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION:
    return entry.data?.messageName || null;
  case EXECUTION_LOG_ENTRY_TYPE.USER_TASK:
    return entry.data?.name || null;
  default:
    return null;
  }
}

function getEntryLabel(entry) {
  switch (entry.type) {
  case EXECUTION_LOG_ENTRY_TYPE.STATUS:
    return STATUS_LABELS[entry.status] || null;
  case EXECUTION_LOG_ENTRY_TYPE.JOB:
    return getJobLabel(entry.data);
  case EXECUTION_LOG_ENTRY_TYPE.USER_TASK:
    return getUserTaskLabel(entry.data);
  case EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION:
    return getMessageSubscriptionLabel(entry.data);
  case EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE:
    return getElementInstanceLabel(entry.data);
  default:
    return null;
  }
}

/**
 * Get label for execution listener job entry. Only return label if job is an
 * execution listener, otherwise return null.
 *
 * @param {Object} jobData
 *
 * @returns {string|null} Label for execution listener job, or null if not an execution listener
 */
function getExecutionListenerLabel(jobData) {
  if (!jobData) {
    return null;
  }

  const {
    kind,
    listenerEventType
  } = jobData;

  if (kind !== 'EXECUTION_LISTENER') {
    return null;
  }

  if (listenerEventType === 'START') {
    return 'Start execution listener';
  } else if (listenerEventType === 'END') {
    return 'End execution listener';
  }

  return null;
}

function getStatusDetails(entry) {
  const data = entry.data;

  if (!data) {
    return [];
  }

  const details = [];

  if (entry.status === EXECUTION_LOG_ENTRY_STATUS.DEPLOYED) {
    if (data.processDefinitionId) details.push({ label: 'Process', value: data.processDefinitionId });
    if (data.processDefinitionKey) details.push({ label: 'Definition Key', value: data.processDefinitionKey });
    if (data.processDefinitionVersion) details.push({ label: 'Version', value: String(data.processDefinitionVersion) });
    if (data.deploymentKey) details.push({ label: 'Deployment Key', value: data.deploymentKey });
  }

  if (entry.status === EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED) {
    if (data.processInstanceKey) details.push({ label: 'Instance Key', value: data.processInstanceKey });
    if (data.processDefinitionId) details.push({ label: 'Process', value: data.processDefinitionId });
    if (data.processDefinitionKey) details.push({ label: 'Definition Key', value: data.processDefinitionKey });
  }

  if (entry.status === EXECUTION_LOG_ENTRY_STATUS.COMPLETED || entry.status === EXECUTION_LOG_ENTRY_STATUS.TERMINATED) {
    if (data.processInstanceKey) details.push({ label: 'Instance Key', value: data.processInstanceKey });
  }

  if (entry.status === EXECUTION_LOG_ENTRY_STATUS.INCIDENT) {
    if (data.processInstanceKey) details.push({ label: 'Instance Key', value: data.processInstanceKey });
    if (data.errorType) details.push({ label: 'Error Type', value: data.errorType });
    if (data.errorMessage) details.push({ label: 'Error', value: data.errorMessage });
  }

  return details;
}

function getEntryDetails(entry) {
  if (entry.type === EXECUTION_LOG_ENTRY_TYPE.STATUS) {
    return getStatusDetails(entry);
  }

  if (entry.type === EXECUTION_LOG_ENTRY_TYPE.JOB) {
    const data = entry.data;
    const details = [];

    if (data.type) details.push({ label: 'Type', value: data.type });
    if (data.elementId) details.push({ label: 'Element', value: data.elementId });

    const listenerLabel = getExecutionListenerLabel(data);
    if (listenerLabel) details.push({ label: 'Kind', value: listenerLabel });
    if (data.state) details.push({ label: 'State', value: data.state });
    if (data.jobKey) details.push({ label: 'Job Key', value: data.jobKey });

    return details;
  }

  if (entry.type === EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION) {
    const data = entry.data;
    const details = [];

    if (data.messageName) details.push({ label: 'Message', value: data.messageName });
    if (data.elementId) details.push({ label: 'Element', value: data.elementId });
    if (data.messageSubscriptionState) details.push({ label: 'State', value: data.messageSubscriptionState });
    if (data.messageSubscriptionKey) details.push({ label: 'Subscription Key', value: data.messageSubscriptionKey });

    return details;
  }

  if (entry.type === EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE) {
    const data = entry.data;
    const details = [];

    if (data.elementId) details.push({ label: 'Element', value: data.elementId });
    if (data.elementName) details.push({ label: 'Name', value: data.elementName });
    if (data.state) details.push({ label: 'State', value: data.state });
    if (data.startDate) details.push({ label: 'Started', value: new Date(data.startDate).toLocaleTimeString() });
    if (data.elementInstanceKey) details.push({ label: 'Instance Key', value: data.elementInstanceKey });

    return details;
  }

  return [];
}

function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Get duration label for an execution log entry if applicable. Duration is only
 * shown for completed element instances and jobs, and is calculated based on
 * the start and end timestamps of the entry.
 *
 * @param {ExecutionLogEntry} entry
 *
 * @returns {string|null}
 */
function getEntryDuration(entry) {
  const { data, type } = entry;

  if (type === EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE) {
    const {
      endDate,
      startDate,
      state
    } = data;

    if ([ 'COMPLETED', 'TERMINATED' ].includes(state) && startDate && endDate) {
      return formatDuration(new Date(endDate).getTime() - new Date(startDate).getTime());
    }
  } else if (type === EXECUTION_LOG_ENTRY_TYPE.JOB) {
    const {
      creationTime,
      endTime,
      state
    } = data;

    if ([ 'COMPLETED', 'FAILED' ].includes(state) && creationTime && endTime) {
      return formatDuration(new Date(endTime).getTime() - new Date(creationTime).getTime());
    }
  } else if (type === EXECUTION_LOG_ENTRY_TYPE.USER_TASK) {
    const {
      completionDate,
      creationDate,
      state
    } = data;

    if ([ 'CANCELED', 'COMPLETED', 'FAILED' ].includes(state) && creationDate && completionDate) {
      return formatDuration(new Date(completionDate).getTime() - new Date(creationDate).getTime());
    }
  }

  return null;
}

function getActiveEntries(entries, isTaskExecuting) {
  if (!isTaskExecuting) return [];

  const activeEntries = [];

  for (const entry of entries) {
    if (entry.type === EXECUTION_LOG_ENTRY_TYPE.JOB && entry.data.state === JOB_STATES.CREATED) {
      activeEntries.push({
        label: 'Waiting for job to be completed',
        secondaryLabel: entry.data.type
      });
    } else if (entry.type === EXECUTION_LOG_ENTRY_TYPE.USER_TASK && entry.data.state === USER_TASK_STATES.CREATED) {
      activeEntries.push({
        label: 'Waiting for user task to be completed',
        secondaryLabel: entry.data.name || entry.data.elementId
      });
    } else if (entry.type === EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION && entry.data.messageSubscriptionState === 'CREATED') {
      activeEntries.push({
        label: 'Waiting for message to be correlated',
        secondaryLabel: entry.data.messageName
      });
    }
  }

  return activeEntries;
}

/**
 * @param {Object} props
 * @param {ExecutionLogEntry[]} props.entries
 * @param {string} [props.tasklistBaseUrl]
 * @param {string|null} [props.currentOperateUrl]
 * @param {boolean} [props.isTaskExecuting]
 */
export function ExecutionLog({ entries, tasklistBaseUrl, currentOperateUrl, isTaskExecuting }) {
  if (!entries.length) {
    return (
      <div className="execution-log">
        <div className="execution-log__empty">No log entries yet. Click <span className="execution-log__empty-action">Test</span> to execute the task.</div>
      </div>
    );
  }

  const activeEntries = getActiveEntries(entries, isTaskExecuting);

  return (
    <div className="execution-log">
      <ol className="execution-log__entries">
        { entries.map((entry, index) => {
          if (entry.type === EXECUTION_LOG_ENTRY_TYPE.STATUS) {
            return <StatusEntry key={ index } entry={ entry } />;
          }

          return (
            <LogEntry
              key={ index }
              entry={ entry }
            />
          );
        }) }
        { activeEntries.map((entry, index) => (
          <li key={ `waiting-${index}` } className="execution-log__entry-wrapper execution-log__entry-wrapper--active">
            <div className="execution-log__entry-content">
              <div className="execution-log__entry">
                <div className="execution-log__labels">
                  <div className="execution-log__label-row">
                    <span className="execution-log__label">{ entry.label }</span>
                  </div>
                  <span className="execution-log__secondary-label">{ entry.secondaryLabel }</span>
                </div>
              </div>
            </div>
          </li>
        )) }
      </ol>
      <JobCallToAction
        entries={ entries }
        currentOperateUrl={ currentOperateUrl }
        isTaskExecuting={ isTaskExecuting }
      />
      <MessageSubscriptionCallToAction
        entries={ entries }
        currentOperateUrl={ currentOperateUrl }
        isTaskExecuting={ isTaskExecuting }
      />
      <UserTaskCallToAction
        entries={ entries }
        tasklistBaseUrl={ tasklistBaseUrl }
        isTaskExecuting={ isTaskExecuting }
      />
    </div>
  );
}

function StatusEntry({ entry }) {
  const [ expanded, setExpanded ] = useState(false);

  const label = STATUS_LABELS[entry.status];

  if (!label) {
    return null;
  }

  const details = getStatusDetails(entry);
  const hasDetails = details.length > 0;
  const isExpandable = hasDetails;

  const handleExpandToggle = () => {
    if (isExpandable) {
      setExpanded(!expanded);
    }
  };

  return (
    <li className="execution-log__entry-wrapper">
      <div className="execution-log__entry-content">
        <div
          className={ classNames('execution-log__entry', { 'execution-log__entry--expandable': isExpandable }) }
          onClick={ isExpandable ? handleExpandToggle : undefined }
        >
          <span className="execution-log__label">{ label }</span>
          { isExpandable && (
            <span
              className="execution-log__toggle"
              onClick={ (event) => {
                event.stopPropagation();
                handleExpandToggle();
              } }
            >
              {
                expanded ? <ChevronDown size={ 16 } className="execution-log__chevron execution-log__chevron--open" />
                  : <ChevronRight size={ 16 } className="execution-log__chevron" />
              }
            </span>
          ) }
        </div>
        { expanded && hasDetails && (
          <dl className="execution-log__details">
            { details.map(({ label, value }, i) => (
              <div key={ i } className="execution-log__details-row">
                <dt className="execution-log__details-label">{ label }</dt>
                <dd className="execution-log__details-value">{ value }</dd>
              </div>
            )) }
          </dl>
        ) }
      </div>
    </li>
  );
}

function LogEntry({ entry }) {
  const [ expanded, setExpanded ] = useState(false);

  const label = getEntryLabel(entry);
  const secondaryLabel = getEntrySecondaryLabel(entry);
  const duration = getEntryDuration(entry);
  const details = getEntryDetails(entry);
  const hasDetails = details.length > 0;
  const isExpandable = hasDetails;

  if (!label) return null;

  const handleExpandToggle = () => {
    if (isExpandable) {
      setExpanded(!expanded);
    }
  };

  const entryClass = [
    'execution-log__entry',
    isExpandable ? 'execution-log__entry--expandable' : ''
  ].filter(Boolean).join(' ');

  return (
    <li className="execution-log__entry-wrapper">
      <div className="execution-log__entry-content">
        <div
          className={ entryClass }
          onClick={ isExpandable ? handleExpandToggle : undefined }
        >
          <div className="execution-log__labels">
            <div className="execution-log__label-row">
              <span className="execution-log__label">{ label }</span>
              { duration && <span className="execution-log__duration">{ duration }</span> }
            </div>
            { secondaryLabel && (
              <span className="execution-log__secondary-label">{ secondaryLabel }</span>
            ) }
          </div>
          { isExpandable && (
            <span
              className="execution-log__toggle"
              onClick={ (event) => {
                event.stopPropagation();
                handleExpandToggle();
              } }
            >
              {
                expanded ? <ChevronDown size={ 16 } className="execution-log__chevron execution-log__chevron--open" />
                  : <ChevronRight size={ 16 } className="execution-log__chevron" />
              }
            </span>
          ) }
        </div>
        { expanded && hasDetails && (
          <dl className="execution-log__details">
            { details.map(({ label, value }, i) => (
              <div key={ i } className="execution-log__details-row">
                <dt className="execution-log__details-label">{ label }</dt>
                <dd className="execution-log__details-value">{ value }</dd>
              </div>
            )) }
          </dl>
        ) }
      </div>
    </li>
  );
}

function JobCallToAction({ entries, currentOperateUrl, isTaskExecuting }) {
  if (!isTaskExecuting) {
    return null;
  }

  const hasPendingExecutionListenerJob = entries.some(
    entry => entry.type === EXECUTION_LOG_ENTRY_TYPE.JOB
      && entry.data.state !== 'COMPLETED'
  );

  if (!hasPendingExecutionListenerJob) {
    return null;
  }

  return (
    <div className="execution-log__cta">
      <div className="execution-log__cta-header">
        <Email size={ 16 } />
        <span className="execution-log__cta-title">Waiting for job completion</span>
      </div>
      <p className="execution-log__cta-description">
        Ensure the corresponding job is completed to continue the test execution.
      </p>
      { currentOperateUrl && (
        <Link
          className="execution-log__cta-link"
          href={ currentOperateUrl }
          target="_blank"
          renderIcon={ Launch }
        >
          Open in Operate
        </Link>
      ) }
    </div>
  );
}

function MessageSubscriptionCallToAction({ entries, currentOperateUrl, isTaskExecuting }) {
  if (!isTaskExecuting) {
    return null;
  }

  const hasActiveSubscription = entries.some(
    entry => entry.type === EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION
      && entry.data.messageSubscriptionState === 'CREATED'
  );

  if (!hasActiveSubscription) {
    return null;
  }

  return (
    <div className="execution-log__cta">
      <div className="execution-log__cta-header">
        <Email size={ 16 } />
        <span className="execution-log__cta-title">Waiting for message correlation</span>
      </div>
      <p className="execution-log__cta-description">
        Ensure the required message is correlated to continue the test execution.
      </p>
      { currentOperateUrl && (
        <Link
          className="execution-log__cta-link"
          href={ currentOperateUrl }
          target="_blank"
          renderIcon={ Launch }
        >
          Open in Operate
        </Link>
      ) }
    </div>
  );
}

function UserTaskCallToAction({ entries, tasklistBaseUrl, isTaskExecuting }) {
  if (!isTaskExecuting) {
    return null;
  }

  const userTask = entries.find(
    entry => entry.type === EXECUTION_LOG_ENTRY_TYPE.USER_TASK
      && entry.data.state === USER_TASK_STATES.CREATED
  );

  if (!userTask) {
    return null;
  }

  const tasklistUrl = getTasklistUrl(tasklistBaseUrl, userTask.data.userTaskKey);

  return (
    <div className="execution-log__cta">
      <div className="execution-log__cta-header">
        <TaskComplete size={ 16 } />
        <span className="execution-log__cta-title">Waiting for user task completion</span>
      </div>
      <p className="execution-log__cta-description">
        Complete the user task to continue the test execution.
      </p>
      { tasklistUrl && (
        <Link
          className="execution-log__cta-link"
          href={ tasklistUrl }
          target="_blank"
          renderIcon={ Launch }
        >
          Open in Tasklist
        </Link>
      ) }
    </div>
  );
}
