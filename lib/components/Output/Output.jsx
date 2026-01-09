import React, { useCallback, useContext, useEffect, useMemo } from 'react';

import {
  Link,
  InlineLoading,
  Tooltip
} from '@carbon/react';

import {
  ErrorFilled,
  CheckmarkFilled,
  InProgress
} from '@carbon/icons-react';

import classNames from 'classnames';

import { OutputVariables } from './OutputVariables';
import { PluginContext } from '../shared/plugins';

export const TASK_EXECUTION_STATUS_LABEL = {
  deploying: 'Deploying...',
  'starting-instance': 'Starting instance...',
  executing: 'Waiting for task to be completed...'
};

export const NO_OPERATE_URL_TOOLTIP = 'No Operate URL set for this connection';

/**
 * @param {Object} props
 * @param {import('bpmn-js/lib/model/Types').Element} props.element
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
  element,
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
        <HeaderLinks
          onResetOutput={ onResetOutput }
          isConnectionConfigured={ isConnectionConfigured }
          currentOperateUrl={ currentOperateUrl }
          element={ element }
          output={ output }
          isTaskExecuting={ isTaskExecuting }
        />
        <OperateLink />
        <ResetButton />
      </div>
      <div className="output__body">
        {
          isConnectionConfigured ?
            <OutputVariables
              isTaskExecuting={ isTaskExecuting }
              output={ output }
              element={ element }
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

const HeaderLinks = (props) => {
  const { getPlugins } = useContext(PluginContext);

  const headerLinkPlugins = getPlugins('header_link');

  return (
    <>
      { headerLinkPlugins.map((link, index) => (
        <React.Fragment key={ index }>
          { link.render(props) }
        </React.Fragment>
      )) }
    </>
  );
};


export const HeaderLink = ({ children = null, render, priority = 100 }) => {
  const { registerPlugin, unregisterPlugin } = useContext(PluginContext);

  useEffect(() => {
    const link = { render, children, priority, slot: 'header_link' };
    registerPlugin(link);

    return () => {
      unregisterPlugin(link);
    };
  }, [ children, render, priority, registerPlugin, unregisterPlugin ]);

  return null;
};

const OperateLink = () => {
  const render = useCallback(({ output, isConnectionConfigured, currentOperateUrl }) => {
    const showOperateUrl = isConnectionConfigured && (currentOperateUrl || (output && !output.error));

    if (!showOperateUrl) {
      return null;
    }

    const operateUrl = currentOperateUrl || output?.operateUrl;

    return (
      <Tooltip
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
    );
  }, []);

  return <HeaderLink priority={ 200 } render={ render } />;
};


function ResetButton() {

  const render = useCallback(({ onResetOutput, isConnectionConfigured, output }) => {
    const showResetButton = isConnectionConfigured && output;

    return showResetButton && <Link
      onClick={ () => onResetOutput() }
      role="button">
      Clear
    </Link>;
  }, []);

  return <HeaderLink priority={ 100 } render={ render } />;
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
  onActionClick
}) {
  return (
    <div className="output__error">
      <div className="output__error--title">
        <span>{title}</span>
        {
          actionLabel && onActionClick && <div className="output__error--action">
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
