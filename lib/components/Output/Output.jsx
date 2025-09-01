import React from 'react';

import { map } from 'min-dash';

import {
  Button,
  CodeSnippet,
  InlineLoading
} from '@carbon/react';

import {
  CheckmarkFilled,
  Reset,
  WarningFilled
} from '@carbon/icons-react';

export default function Output({
  inputError,
  isTaskExecuting,
  onCancelTaskExecution,
  onExecuteTask,
  output,
  resetOutput,
  taskExecutionStateDescription
}) {
  return (
    <div className="output">
      <div className="output__header">
        <div className="output__header--title">
          Results
        </div>
        <div className="output__header--buttons">
          <Button
            kind="ghost"
            onClick={ resetOutput }
            size="sm"
            renderIcon={ Reset }
            hasIconOnly
            tooltipPosition="right"
            iconDescription="Reset output"
          >Reset</Button>
        </div>
      </div>
      <div className="output__body">
        <div className="output__body--inner">
          <Execute
            isTaskExecuting={ isTaskExecuting }
            inputError={ inputError }
            onCancelTaskExecution={ onCancelTaskExecution }
            onExecuteTask={ onExecuteTask }
            output={ output }
            taskExecutionStateDescription={ taskExecutionStateDescription }
          />
          <Success
            output={ output } />
          <Error
            output={ output } />
        </div>
      </div>
    </div>
  );
}

function Execute(props) {
  const {
    isTaskExecuting,
    output,
    taskExecutionStateDescription
  } = props;

  if (output) {
    return null;
  }

  return <div className="output__state output__state--execute">
    <div className="output__state-title">
      {
        isTaskExecuting
          ? <>
            <InlineLoading status="active" />
            <span className="output__status-text">{ taskExecutionStateDescription }</span>
          </>
          : <>
            <CheckmarkFilled className="output__status-icon" />
            <span className="output__status-text">Ready to test</span>
          </>
      }
    </div>
  </div>;
}

function Success({
  output
}) {
  if (!output || !output.success) {
    return null;
  }

  return <>
    <div className="output__state output__state--success">
      <div className="output__state-title">
        <CheckmarkFilled className="output__status-icon" />
        <span className="output__status-text">Task executed successfully</span>
      </div>
    </div>
    <div className="output__variables">
      <div className="output__variables--title">Variables</div>
      <CodeSnippet
        type="multi"
        feedback="Copied to clipboard"
        hideCopyButton={ false }
        maxCollapsedNumberOfRows={ 100 }
        align="left"
      >
        { JSON.stringify(output.variables, null, 2) }
      </CodeSnippet>
    </div>
  </>;
}

function Error({
  output
}) {
  if (!output || output.success) {
    return null;
  }

  const {
    error,
    incident
  } = output;

  return <div className="output__state output__state--error">
    <div className="output__state-title">
      <WarningFilled className="output__status-icon" />
      <span className="output__status-text">{ incident ? 'Task execution failed due to incident' : 'Task execution failed due to error' }</span>
    </div>
    <div className="output__state-details">
      <IncidentDetails incident={ incident } />
      <ErrorDetails error={ error } />
    </div>
  </div>;
}

function IncidentDetails({ incident }) {
  if (!incident) {
    return null;
  }

  return (
    <div className="incident-details">
      <div className="grid-table">
        {
          map(incident, (value, key) => {
            const { label, display } = incidentProperties[key];

            return (
              <div key={ key } className="grid-row">
                <div className="grid-cell label">{ label }</div>
                <div className="grid-cell value">{ display ? display(value) : value }</div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

function ErrorDetails({ error }) {
  if (!error) {
    return null;
  }

  const { message, response = {} } = error;

  const { error: responseError } = response;

  return (
    <div className="error-details">
      <div className="grid-table">
        <div className="grid-row">
          <div className="grid-cell label">Message:</div>
          <div className="grid-cell value">{ message }</div>
        </div>
        {
          responseError && (
            <div className="grid-row">
              <div className="grid-cell label">Response error:</div>
              <div className="grid-cell value">{ JSON.stringify(responseError, null, 2) }</div>
            </div>
          )
        }
      </div>
    </div>
  );
}

const incidentProperties = {
  key: {
    key: 'key',
    label: 'Incident key:'
  },
  processDefinitionKey: {
    key: 'processDefinitionKey',
    label: 'Process definition key:'
  },
  processInstanceKey: {
    key: 'processInstanceKey',
    label: 'Process instance key:'
  },
  type: {
    key: 'type',
    label: 'Type:'
  },
  message: {
    key: 'message',
    label: 'Message:'
  },
  creationTime: {
    key: 'creationTime',
    label: 'Creation time:',
    display: (value) => new Date(value).toLocaleString()
  },
  state: {
    key: 'state',
    label: 'State:'
  },
  jobKey: {
    key: 'jobKey',
    label: 'Job key:'
  },
  tenantId: {
    key: 'tenantId',
    label: 'Tenant ID:'
  }
};