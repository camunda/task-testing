import React from 'react';

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
  element,
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

  const {
    key,
    processDefinitionKey,
    processInstanceKey,
    type,
    message,
    creationTime,
    state,
    jobKey,
    tenantId
  } = incident;

  return (
    <div className="incident-details">
      <div className="grid-table">
        <div className="grid-row">
          <div className="grid-cell label">Incident key:</div>
          <div className="grid-cell value">{ key }</div>
        </div>
        <div className="grid-row">
          <div className="grid-cell label">Process definition key:</div>
          <div className="grid-cell value">{ processDefinitionKey }</div>
        </div>
        <div className="grid-row">
          <div className="grid-cell label">Process instance key:</div>
          <div className="grid-cell value">{ processInstanceKey }</div>
        </div>
        <div className="grid-row">
          <div className="grid-cell label">Type:</div>
          <div className="grid-cell value">{ type }</div>
        </div>
        <div className="grid-row">
          <div className="grid-cell label">Message:</div>
          <div className="grid-cell value">{ message }</div>
        </div>
        <div className="grid-row">
          <div className="grid-cell label">Creation time:</div>
          <div className="grid-cell value">{ new Date(creationTime).toLocaleString() }</div>
        </div>
        <div className="grid-row">
          <div className="grid-cell label">State:</div>
          <div className="grid-cell value">{ state }</div>
        </div>
        <div className="grid-row">
          <div className="grid-cell label">Job key:</div>
          <div className="grid-cell value">{ jobKey }</div>
        </div>
        {
          tenantId && (
            <div className="grid-row">
              <div className="grid-cell label">Tenant ID:</div>
              <div className="grid-cell value">{ tenantId }</div>
            </div>
          )
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