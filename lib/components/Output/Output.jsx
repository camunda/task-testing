import React, { useMemo } from 'react';

import {
  Button,
  CodeSnippetSkeleton,
  Link,
  InlineLoading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel
} from '@carbon/react';

import {
  ErrorFilled,
  Reset,
  CheckmarkFilled,
  InProgress
} from '@carbon/icons-react';

import OutputEditor from './OutputEditor';

import { SCOPES } from '../../TaskExecution';

export const TASK_EXECUTION_STATUS_LABEL = {
  deploying: 'Deploying...',
  'starting-instance': 'Starting instance...',
  executing: 'Waiting for task to be completed...'
};

/**
 * @param {Object} props
 * @param {boolean} props.isConnectionConfigured
 * @param {string} props.configureConnectionBannerTitle
 * @param {string} props.configureConnectionBannerDescription
 * @param {string} props.configureConnectionLabel
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

  const showResetButton = isConnectionConfigured && (output?.success || output?.error || output?.incident);
  const showOperateUrl = isConnectionConfigured && output?.operateUrl;

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
        {
          showOperateUrl && <Link
            href={ output.operateUrl }
            target="_blank"
            className="output__header--button-operate">
            View in Operate
          </Link>
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
            <OutputEditor value={ printIncident(output.incident) } />
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

/**
 * Pick variables for a given scope.
 *
 * @param {Object} variables
 * @param {string} scope
 *
 * @returns {Object}
 */
export function pickVariables(variables, scope) {
  return Object.entries(variables).reduce((acc, [ name, variable ]) => {
    if (scope === variable?.scope) {
      acc[name] = variable.value;
    }

    return acc;
  }, {});
}