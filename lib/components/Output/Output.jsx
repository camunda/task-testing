import React from 'react';

import {
  Button,
  CodeSnippet,
  Link
} from '@carbon/react';

import {
  ErrorFilled,
  Reset
} from '@carbon/icons-react';

export default function Output({
  isConnectionConfigured,
  onConfigureConnection,
  isTaskExecuting,
  output,
  onResetOutput
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
            onClick={ onResetOutput }
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
          <ConfigureConnection
            isConnectionConfigured={ isConnectionConfigured }
            onConfigureConnection={ onConfigureConnection }
          />
          <NoResults
            isConnectionConfigured={ isConnectionConfigured }
            isTaskExecuting={ isTaskExecuting }
            output={ output }
          />
          <Success
            isConnectionConfigured={ isConnectionConfigured }
            isTaskExecuting={ isTaskExecuting }
            output={ output } />
          <Error
            isConnectionConfigured={ isConnectionConfigured }
            isTaskExecuting={ isTaskExecuting }
            output={ output } />
        </div>
      </div>
    </div>
  );
}

function ConfigureConnection(props) {
  const {
    isConnectionConfigured,
    onConfigureConnection
  } = props;

  if (isConnectionConfigured) {
    return null;
  }

  return <>
    <div className="output__state output__state--error">
      <div className="output__state-icon">
        <ErrorFilled className="output__status-icon" />
      </div>
      <div className="output__state-content">
        <div className="output__state-title">
          <span>
            Connection required
          </span>
          {
            onConfigureConnection && <Link onClick={ onConfigureConnection }>
              Configure
            </Link>
          }
        </div>
        <div className="output__state-details">
          <span>Configure a connection to start testing.</span>
        </div>
      </div>
    </div>
  </>;
}

function NoResults(props) {
  const {
    isConnectionConfigured,
    isTaskExecuting,
    output
  } = props;

  if (!isConnectionConfigured || isTaskExecuting || output) {
    return null;
  }

  return <div className="output__variables output__variables--no-results">
    <CodeSnippet
      type="multi"
      hideCopyButton={ true }
      maxCollapsedNumberOfRows={ 100 }
    >
      { 'Test task to see results' }
    </CodeSnippet>
  </div>;
}

function Success({
  isConnectionConfigured,
  isTaskExecuting,
  output
}) {
  if (!isConnectionConfigured || isTaskExecuting || !output || !output.success) {
    return null;
  }

  return <div className="output__variables">
    <CodeSnippet
      type="multi"
      feedback="Copied to clipboard"
      hideCopyButton={ false }
      maxCollapsedNumberOfRows={ 100 }
      align="left"
    >
      { JSON.stringify(output.variables, null, 2) }
    </CodeSnippet>
  </div>;
}

function Error({
  isConnectionConfigured,
  isTaskExecuting,
  output
}) {
  if (!isConnectionConfigured || isTaskExecuting || !output || output.success) {
    return null;
  }

  const {
    error,
    incident
  } = output;

  return <>
    <div className="output__state output__state--error">
      <div className="output__state-icon">
        <ErrorFilled className="output__status-icon" />
      </div>
      <div className="output__state-content">
        <div className="output__state-title">
          Task execution failed
        </div>
        <div className="output__state-details">
          {
            incident && <span>Incident: { incident.errorType }</span>
          }
          {
            error && <span>Error: { error.message }</span>
          }
        </div>
      </div>
    </div>
    {
      incident && <CodeSnippet
        type="multi"
        feedback="Copied to clipboard"
        hideCopyButton={ false }
        maxCollapsedNumberOfRows={ 100 }
        align="left"
      >
        { printIncident(incident) }
      </CodeSnippet>
    }
    {
      error && <CodeSnippet
        type="multi"
        feedback="Copied to clipboard"
        hideCopyButton={ false }
        maxCollapsedNumberOfRows={ 100 }
        align="left"
      >
        { error.detail || 'No error details available' }
      </CodeSnippet>
    }
  </>;
}

/**
 * Print the details of an incident.
 *
 * @param {Object} incident
 *
 * @returns {string}
 */
function printIncident(incident) {
  let text = '';

  Object.keys(incident).forEach((key) => {
    text += `${capitalize(key)}: ${JSON.stringify(incident[key], null, 2)}\n`;
  });

  return text;
}

/**
 * Capitalize a string, adding spaces before capital letters.
 *
 * @example
 *
 * capitalize('fooBar'); // Foo Bar
 *
 * @param {string} string
 *
 * @returns {string}
 */
function capitalize(string) {
  return string.replace(/([A-Z])/g, ' $1').replace(/^./, (match) => match.toUpperCase());
}