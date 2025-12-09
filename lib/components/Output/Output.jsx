import React, { useMemo } from 'react';

import {
  CodeSnippetSkeleton,
  Link,
  InlineLoading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Tooltip
} from '@carbon/react';

import {
  ErrorFilled,
  CheckmarkFilled,
  InProgress
} from '@carbon/icons-react';

import classNames from 'classnames';

import { isObject, has } from 'min-dash';

import OutputEditor from './OutputEditor';

import { SCOPES } from '../../TaskExecution';

export const TASK_EXECUTION_STATUS_LABEL = {
  deploying: 'Deploying...',
  'starting-instance': 'Starting instance...',
  executing: 'Waiting for task to be completed...'
};

export const NO_OPERATE_URL_TOOLTIP = 'No Operate URL set for this connection';

/**
 * @param {Object} props
 * @param {boolean} props.isConnectionConfigured
 * @param {string} props.configureConnectionBannerTitle
 * @param {string} props.configureConnectionBannerDescription
 * @param {string} props.configureConnectionLabel
 * @param {string|undefined} props.currentOperateUrl
 * @param {Function} [props.onConfigureConnection]
 * @param {boolean} props.isTaskExecuting
 * @param {import('../../types').ElementOutput} props.output
 * @param {Function} props.onResetOutput
 * @param {import('../../types').TaskExecutionStatus} props.taskExecutionStatus
 */
export default function Output({
  isConnectionConfigured,
  configureConnectionBannerTitle,
  configureConnectionBannerDescription,
  configureConnectionLabel,
  onConfigureConnection,
  isTaskExecuting,
  output,
  currentOperateUrl,
  onResetOutput,
  taskExecutionStatus
}) {

  const statusIcon = useMemo(() => {
    if (output?.error || output?.incident || !isConnectionConfigured) {
      return <ErrorFilled className="output__status-icon--error" />;
    }

    if (output?.success) {
      return <CheckmarkFilled className="output__status-icon--success" />;
    }

    if (isTaskExecuting) {
      return <InlineLoading />;
    }

    return <InProgress className="output__status-icon--ready" />;
  }, [ output, isTaskExecuting, isConnectionConfigured ]);

  const showResetButton = isConnectionConfigured && output;
  const showOperateUrl = isConnectionConfigured && (currentOperateUrl || (output && !output.error));
  const operateUrl = currentOperateUrl || output?.operateUrl;

  const headerText = useMemo(() => {
    if (isTaskExecuting) {
      return TASK_EXECUTION_STATUS_LABEL[taskExecutionStatus];
    }

    if (!isConnectionConfigured) {
      return 'Connection error';
    }

    if (output) {
      if (output.error) {
        return output.error.message ? `Error: ${output.error.message}` : 'Error';
      }

      if (output.incident) {
        return output.incident.errorType ? `Incident: ${output.incident.errorType}` : 'Incident';
      }

      if (output.success) {
        return 'Success';
      }
    }

    return 'Ready';
  }, [ isTaskExecuting, taskExecutionStatus, output, isConnectionConfigured ]);

  return (
    <div className="output">
      <div className="output__header">
        <div className="output__header--title">
          { statusIcon }
          <span>{headerText}</span>
        </div>
        {showOperateUrl && <Tooltip
          className={ classNames({ 'show-tooltip': !operateUrl }) }
          autoAlign
          label={ NO_OPERATE_URL_TOOLTIP }
        >
          <Link
            className={ classNames({ 'link--disabled': !operateUrl }) }
            href={ operateUrl }
            target="_blank"
          >
            View in Operate
          </Link>
        </Tooltip>
        }
        { showResetButton && <Link
          onClick={ () => onResetOutput() }
          role="button">
          Clear
        </Link>}
      </div>
      <div className="output__body">
        {
          isConnectionConfigured ?
            <OutputVariables
              isTaskExecuting={ isTaskExecuting }
              output={ output }
            />
            :
            <ErrorBanner
              title={ configureConnectionBannerTitle }
              description={ configureConnectionBannerDescription }
              actionLabel={ configureConnectionLabel }
              onActionClick={ onConfigureConnection }
            />
        }
      </div>
    </div>
  );
}

function OutputVariables({
  isTaskExecuting,
  output
}) {

  if (isTaskExecuting) {
    return <CodeSnippetSkeleton className="output__variables--skeleton" type="multi" />;
  }

  if (output?.success) {
    return (
      <Tabs>
        <TabList>
          <Tab>Process variables</Tab>
          <Tab>Local variables</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <OutputEditor value={ JSON.stringify(pickVariables(output.variables, SCOPES.PROCESS), null, 2) } />
          </TabPanel>
          <TabPanel>
            <OutputEditor value={ JSON.stringify(pickVariables(output.variables, SCOPES.LOCAL), null, 2) } />
          </TabPanel>
        </TabPanels>
      </Tabs>
    );
  }

  if (output?.error) {
    return <OutputEditor
      value={ output?.error.response || 'No error details available' }
    />;
  }

  if (output?.incident) {
    return (
      <Tabs>
        <TabList>
          <Tab>Incident</Tab>
          <Tab>Process variables</Tab>
          <Tab>Local variables</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <IncidentDetails { ...output.incident } />
          </TabPanel>
          <TabPanel>
            <OutputEditor value={ JSON.stringify(pickVariables(output.variables, SCOPES.PROCESS), null, 2) } />
          </TabPanel>
          <TabPanel>
            <OutputEditor value={ JSON.stringify(pickVariables(output.variables, SCOPES.LOCAL), null, 2) } />
          </TabPanel>
        </TabPanels>
      </Tabs>
    );
  }

  return <div className="output__variables--empty">
    <div>
      Enter process variables, then click <span className="output__variables--empty-action">Test task</span> to see how they change once the task has executed.
    </div>
  </div>;
}

/**
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} [props.actionLabel]
 * @param {string} [props.actionUrl]
 * @param {Function} [props.onActionClick]
 */
function ErrorBanner({
  title,
  description,
  actionLabel,
  actionUrl = '#',
  onActionClick = () => {}
}) {
  return (
    <div className="output__error">
      <div className="output__error--title">
        <span>{title}</span>
        {
          actionLabel && <div className="output__error--action">
            <Link href={ actionUrl } onClick={ () => onActionClick() }>
              { actionLabel }
            </Link>
          </div>
        }
      </div>
      <div className="output__error--content">
        <span>{ description }</span>
      </div>
    </div>
  );
}

function IncidentDetails({
  errorType,
  errorMessage,
  creationTime,
  ...rest
}) {
  return (
    <div className="output__incident--details">
      <div>
        <span className="bold">Type: </span>
        {errorType}
      </div>
      <div>
        <span className="bold">Creation Time: </span>
        {new Date(creationTime).toLocaleString()}
      </div>
      <div>
        <pre>
          <span className="bold">Message: </span>
          {errorMessage}
        </pre>
      </div>

      { Object.entries(rest).map(([ key, value ]) => (
        <div key={ key }>
          <span className="bold">{capitalize(key)}:</span> {value}
        </div>
      )) }
    </div>
  );
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

/**
 * Pick variables for a given scope. Variables in legacy format are ignored.
 *
 * @param {import('../../types').ElementOutputVariables} variables
 * @param {string} scope
 *
 * @returns {Object}
 */
export function pickVariables(variables, scope) {
  return Object.values(variables).reduce((acc, variable) => {

    // Ignore variables in legacy formats
    // see https://github.com/camunda/task-testing/issues/12 and https://github.com/camunda/task-testing/issues/48 for legacy format
    if (isObject(variable) && has(variable, 'name') && scope === variable.scope) {
      acc[variable.name] = variable.value;
    }

    return acc;
  }, {});
}