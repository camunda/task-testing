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

import { isFunction } from 'min-dash';

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
          isConnectionConfigured && (
            <OutputVariables
              isTaskExecuting={ isTaskExecuting }
              output={ output }
              element={ element }
            />
          )
        }
      </div>
    </div>
  );
}

const HeaderLinks = (props) => {
  const { getPlugins } = useContext(PluginContext);

  const plugins = getPlugins('output.header.link');

  const headerLinks = plugins.reduce((accHeaderLinks, plugin) => {
    const getProp = (value) => isFunction(value) ? value(props) : value;

    const visible = getProp(plugin.visible) ?? true;

    if (!visible) {
      return accHeaderLinks;
    }

    const content = plugin.render?.(props) || plugin.children;

    accHeaderLinks.push({
      content,
      href: getProp(plugin.href),
      target: getProp(plugin.target),
      className: getProp(plugin.className),
      onClick: getProp(plugin.onClick),
      role: getProp(plugin.role),
      tooltip: getProp(plugin.tooltip)
    });

    return accHeaderLinks;
  }, /** @type {Array<{content: any, href: any, target: any, className: any, onClick: any, role: any, tooltip: any}>} */ ([]));

  return (
    <>
      { headerLinks.map(({ content, href, target, className, onClick, role, tooltip }, index) => {
        const headerLink = (
          <Link
            key={ index }
            href={ href }
            target={ target }
            className={ className }
            onClick={ onClick }
            role={ role }
          >
            { content }
          </Link>
        );

        if (tooltip) {
          return (
            <Tooltip key={ index } autoAlign label={ tooltip }>
              { headerLink }
            </Tooltip>
          );
        }

        return headerLink;
      }) }
    </>
  );
};

/**
 * @param {Object} props
 * @param {(props: Object) => React.ReactNode} [props.render] - Function that returns link content
 * @param {React.ReactNode} [props.children] - Static content to render
 * @param {boolean | ((props: Object) => boolean)} [props.visible] - Whether to show the link (default: true)
 * @param {string | ((props: Object) => string)} [props.href] - Link URL (static or dynamic)
 * @param {string | ((props: Object) => string)} [props.target] - Link target (static or dynamic)
 * @param {string | ((props: Object) => string | undefined)} [props.className] - Link class name (static or dynamic)
 * @param {Function | ((props: Object) => Function)} [props.onClick] - Click handler (static or dynamic)
 * @param {string | ((props: Object) => string)} [props.role] - ARIA role (static or dynamic)
 * @param {string | ((props: Object) => string | undefined)} [props.tooltip] - Tooltip text (static or dynamic)
 * @param {number} [props.priority] - Priority for sorting (higher values first)
 * @returns {null}
 */
export const HeaderLink = ({ children = null, render = () => null, visible, href, target, className, onClick, role, tooltip, priority = 100 }) => {
  const { registerPlugin, unregisterPlugin } = useContext(PluginContext);

  useEffect(() => {
    const link = { children, render, visible, href, target, className, onClick, role, tooltip, priority, type: 'output.header.link' };
    registerPlugin(link);

    return () => {
      unregisterPlugin(link);
    };
  }, [ children, render, visible, href, target, className, onClick, role, tooltip, priority, registerPlugin, unregisterPlugin ]);

  return null;
};

const OperateLink = () => {
  const render = useCallback(() => 'View in Operate', []);

  const getVisible = useCallback(({ output, isConnectionConfigured, currentOperateUrl }) => {
    return isConnectionConfigured && (currentOperateUrl || (output && !output.error));
  }, []);

  const getHref = useCallback(({ output, currentOperateUrl }) => {
    return currentOperateUrl || output?.operateUrl;
  }, []);

  const getClassName = useCallback(({ output, currentOperateUrl }) => {
    const operateUrl = currentOperateUrl || output?.operateUrl;
    return !operateUrl ? 'link--disabled' : undefined;
  }, []);

  const getTooltip = useCallback(({ output, currentOperateUrl }) => {
    const operateUrl = currentOperateUrl || output?.operateUrl;
    return !operateUrl ? NO_OPERATE_URL_TOOLTIP : undefined;
  }, []);

  return <HeaderLink
    priority={ 200 }
    render={ render }
    visible={ getVisible }
    href={ getHref }
    target="_blank"
    className={ getClassName }
    tooltip={ getTooltip }
  />;
};


function ResetButton() {
  const render = useCallback(() => 'Clear', []);

  const getVisible = useCallback(({ isConnectionConfigured, output }) => {
    return isConnectionConfigured && output;
  }, []);

  const getOnClick = useCallback(({ onResetOutput }) => {
    return () => onResetOutput();
  }, []);

  return <HeaderLink
    priority={ 100 }
    render={ render }
    visible={ getVisible }
    onClick={ getOnClick }
    role="button"
  />;
}
