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

import { jsonDiff } from '../../utils/json-diff';

export const TASK_EXECUTION_STATUS_LABEL = {
  deploying: 'Deploying...',
  'starting-instance': 'Starting instance...',
  executing: 'Waiting for task to be completed...'
};

/**
 * @param {Object} props
 * @param {boolean} props.isConnectionConfigured
 * @param {string} [props.configureConnectionBannerTitle]
 * @param {string} [props.configureConnectionBannerDescription]
 * @param {string} [props.configureConnectionLabel]
 * @param {Function} [props.onConfigureConnection]
 * @param {boolean} props.isTaskExecuting
 * @param {string} props.input
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
  input,
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
  const headerText = isTaskExecuting ? TASK_EXECUTION_STATUS_LABEL[taskExecutionStatus] : 'Results';

  return (
    <div className="output">
      <div className="output__header">
        <div className="output__header--title">
          { statusIcon }
          <span>{headerText}</span>
        </div>
        {
          showResetButton && <Button
            kind="ghost"
            onClick={ () => onResetOutput() }
            size="sm"
            renderIcon={ Reset }
            hasIconOnly
            tooltipPosition="right"
            iconDescription="Reset output"
          >Reset</Button>
        }
        {
          showOperateUrl && <Link
            href={ output.operateUrl }
            target="_blank"
            className="output__header--button-operate">
            View in Operate
          </Link>
        }
      </div>
      <div className="output__body">
        <OutputBanner
          isConnectionConfigured={ isConnectionConfigured }
          configureConnectionBannerTitle={ configureConnectionBannerTitle }
          configureConnectionBannerDescription={ configureConnectionBannerDescription }
          configureConnectionLabel={ configureConnectionLabel }
          onConfigureConnection={ onConfigureConnection }
          output={ output }
        />
        {
          isConnectionConfigured &&
            <OutputVariables
              isTaskExecuting={ isTaskExecuting }
              output={ output }
              input={ input }
            />
        }
      </div>
    </div>
  );
}

function OutputBanner({
  isConnectionConfigured,
  configureConnectionBannerTitle,
  configureConnectionBannerDescription,
  configureConnectionLabel,
  onConfigureConnection,
  output
}) {

  if (!isConnectionConfigured) {
    return <ErrorBanner
      title={ configureConnectionBannerTitle }
      description={ configureConnectionBannerDescription }
      actionLabel={ configureConnectionLabel }
      onActionClick={ onConfigureConnection }
    />;
  }

  if (output?.error) {
    return <ErrorBanner
      title="Task execution failed"
      description={ `Error: ${output.error.message}` }
    />;
  }

  if (output?.incident) {
    const action = output.incident.operateUrl ?
      { actionLabel: 'View in Operate', actionUrl: output.incident.operateUrl } : {};

    return <ErrorBanner
      title="Task execution failed"
      description={ `Incident: ${output.incident.errorType}` }
      { ...action }
    />;
  }

  return null;
}

function OutputVariables({
  isTaskExecuting,
  output,
  input
}) {

  if (isTaskExecuting) {
    return <CodeSnippetSkeleton className="output__variables--skeleton" type="multi" />;
  }

  if (output?.success) {
    const { added, modified } = jsonDiff(JSON.parse(input || '{}'), output.variables);

    return <OutputEditor
      value={ JSON.stringify(output.variables, null, 2) }
      added={ added }
      modified={ modified }
    />;

    // TODO: Introduce tabs when able to filter variables by `scopeKey`
    // return (
    //   <Tabs>
    //     <TabList>
    //       <Tab>Process variables</Tab>
    //       <Tab>Task variables</Tab>
    //     </TabList>
    //     <TabPanels>
    //       <TabPanel>
    //         <OutputEditor value={ JSON.stringify(output.variables, null, 2) } />
    //       </TabPanel>
    //       <TabPanel>
    //         <OutputEditor value={ JSON.stringify(output.variables, null, 2) } />
    //       </TabPanel>
    //     </TabPanels>
    //   </Tabs>
    // );
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
        </TabList>
        <TabPanels>
          <TabPanel>
            <OutputEditor value={ printIncident(output.incident) } />
          </TabPanel>
          <TabPanel>
            <OutputEditor value={ JSON.stringify(output.variables, null, 2) } />
          </TabPanel>
        </TabPanels>
      </Tabs>
    );
  }

  return <div className="output__variables--empty">
    <div>
      Enter input variables, then click <span className="output__variables--empty-action">Test task</span> to see results.
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