/**
 * @import {
 *   Element
 * } from 'bpmn-js/lib/model/Types';
 *
 * @import {
 *   ElementOutput,
 *   ExecutionLogEntry,
 *   ExecutionLogJobEntry,
 *   ExecutionLogUserTaskEntry,
 *   ExecutionLogMessageSubscriptionEntry,
 *   TaskExecutionState
 * } from '../../types';
 */

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  InlineLoading,
  Link,
  SkeletonPlaceholder
} from '@carbon/react';

import {
  CheckmarkFilled,
  ChevronDown,
  ChevronRight,
  ErrorFilled,
  Launch,
  StopFilledAlt,
  WarningFilled
} from '@carbon/icons-react';

import { isFunction } from 'min-dash';

import OutputEditor from './OutputEditor';
import { ExecutionLog } from './ExecutionLog';
import { PluginContext } from '../shared/plugins';
import Tooltip from '../shared/Tooltip';
import { SCOPES, pickVariables } from '../../utils/variables';
import { EXECUTION_LOG_ENTRY_TYPE } from '../../ExecutionLog';
import { getTasklistUrl } from '../../utils/getTasklistUrl';

/**
 * @param {Object} props
 * @param {Element} props.element
 * @param {boolean} props.isConnectionConfigured
 * @param {string|null} props.currentOperateUrl
 * @param {boolean} props.isTaskExecuting
 * @param {ElementOutput} props.output
 * @param {Function} props.onResetOutput
 * @param {TaskExecutionState} props.taskExecutionState
 * @param {ExecutionLogEntry[]} props.executionLog
 * @param {string} [props.tasklistBaseUrl]
 * @param {Object} [props.currentVariables]
 * @param {(element: Element, path: string, value: *) => void} [props.onAddToExampleData]
 * @param {(element: Element, sourceFeelExpression: string, targetName: string) => void} [props.onAppendOutputMapping]
 */
export default function Output({
  element,
  isConnectionConfigured,
  isTaskExecuting,
  output,
  currentOperateUrl,
  onResetOutput,
  taskExecutionState,
  executionLog,
  tasklistBaseUrl,
  currentVariables,
  onAddToExampleData,
  onAppendOutputMapping
}) {

  const isError = output?.error || output?.incident;
  const isSuccess = output?.success && !isError;
  const isTerminated = output?.terminated;
  const isCanceled = output?.canceled;

  const bannerVariant = useMemo(() => {
    if (isError) return 'error';
    if (isSuccess) return 'success';
    if (isTerminated) return 'warning';
    if (isCanceled) return 'canceled';
    return null;
  }, [ isError, isSuccess, isTerminated, isCanceled ]);

  const statusIcon = useMemo(() => {
    if (isError) {
      return <WarningFilled />;
    }

    if (isSuccess) {
      return <CheckmarkFilled />;
    }

    if (isTerminated) {
      return <StopFilledAlt />;
    }

    if (isCanceled) {
      return <ErrorFilled />;
    }

    return null;
  }, [ isError, isSuccess, isTerminated, isCanceled ]);

  const timingText = useMemo(() => {
    if (!output?.startedAt || !output?.finishedAt) return null;

    const durationMs = output.finishedAt - output.startedAt;

    return durationMs < 1000
      ? `${durationMs}ms`
      : `${(durationMs / 1000).toFixed(1)}s`;
  }, [ output ]);

  return (
    <div className="output">
      {
        isTaskExecuting && <ExecutingBanner
          currentOperateUrl={ currentOperateUrl }
          entries={ executionLog }
          tasklistBaseUrl={ tasklistBaseUrl }
        />
      }
      { !isTaskExecuting && output && (
        <ResultBanner
          bannerVariant={ bannerVariant }
          statusIcon={ statusIcon }
          timingText={ timingText }
          onResetOutput={ onResetOutput }
          isConnectionConfigured={ isConnectionConfigured }
          currentOperateUrl={ currentOperateUrl }
          element={ element }
          output={ output }
          isTaskExecuting={ isTaskExecuting }
        />
      ) }
      { !isTaskExecuting && !output ? (
        <EmptyState />
      ) : (
        <div className="output__body">
          <CollapsibleSection
            key={ bannerVariant }
            title="Log"
            defaultOpen={ !isSuccess || isTaskExecuting }
            isExecuting={ isTaskExecuting }
            collapsedHint={ isSuccess ? 'View steps' : undefined }
          >
            { executionLog?.length > 0 ? (
              <ExecutionLog
                entries={ executionLog }
                isTaskExecuting={ isTaskExecuting }
              />
            ) : (
              <div className="output__section-empty">Result does not have a log.</div>
            ) }
          </CollapsibleSection>
          <VariablesSection
            title="Process Variables"
            tooltip={ <span>Variables in the process scope. <a
              href="https://docs.camunda.io/docs/components/concepts/variables/"
              target="_blank"
              rel="noopener noreferrer"
            >Learn more.</a></span> }
            scope={ SCOPES.PROCESS }
            output={ output }
            currentVariables={ currentVariables }
            isTaskExecuting={ isTaskExecuting }
            element={ element }
            onAddToExampleData={ onAddToExampleData }
            onAppendOutputMapping={ onAppendOutputMapping }
          />
          <VariablesSection
            title="Local Variables"
            tooltip={ <span>Variables in the scope of the executed element. <a
              href="https://docs.camunda.io/docs/components/concepts/variables/"
              target="_blank"
              rel="noopener noreferrer"
            >Learn more.</a></span> }
            scope={ SCOPES.LOCAL }
            output={ output }
            currentVariables={ currentVariables }
            isTaskExecuting={ isTaskExecuting }
            element={ element }
            onAddToExampleData={ onAddToExampleData }
            onAppendOutputMapping={ onAppendOutputMapping }
          />
        </div>
      ) }
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
      renderIcon: getProp(plugin.renderIcon),
      role: getProp(plugin.role),
      tooltip: getProp(plugin.tooltip)
    });

    return accHeaderLinks;
  }, /** @type {Array<{content: any, href: any, target: any, className: any, onClick: any, role: any, tooltip: any, renderIcon: any}>} */ ([]));

  return (
    <>
      { headerLinks.map(({ content, href, target, className, onClick, renderIcon, role, tooltip }, index) => {
        const headerLink = (
          <Link
            key={ index }
            href={ href }
            target={ target }
            className={ className }
            onClick={ onClick }
            renderIcon={ renderIcon }
            role={ role }
          >
            { content }
          </Link>
        );

        if (tooltip) {
          return (
            <Tooltip className="has-tooltip" key={ index } label={ tooltip } align="bottom-start">
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
 * @param {React.ComponentType | ((props: Object) => React.ComponentType)} [props.renderIcon] - Icon
 * @param {number} [props.priority] - Priority for sorting (higher values first)
 * @returns {null}
 */
const DEFAULT_RENDER = /** @type {(props?: any) => React.ReactNode} */ (() => null);

export const HeaderLink = ({ children = null, render = DEFAULT_RENDER, visible, href, target, className, onClick = undefined, renderIcon, role = undefined, tooltip, priority = 100 }) => {
  const { registerPlugin, unregisterPlugin } = useContext(PluginContext);

  useEffect(() => {
    const link = { children, render, visible, href, target, className, onClick, renderIcon, role, tooltip, priority, type: 'output.header.link' };
    registerPlugin(link);

    return () => {
      unregisterPlugin(link);
    };
  }, [ children, render, visible, href, target, className, onClick, renderIcon, role, tooltip, priority, registerPlugin, unregisterPlugin ]);

  return null;
};

const OperateLink = () => {
  const render = useCallback(() => 'Open in Operate', []);

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

    return !operateUrl ? 'Operate URL not found' : null;
  }, []);

  return <HeaderLink
    priority={ Infinity }
    render={ render }
    visible={ getVisible }
    href={ getHref }
    target="_blank"
    className={ getClassName }
    tooltip={ getTooltip }
    renderIcon={ Launch }
  />;
};

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="mask0_191_9328" style={ { maskType: 'luminance' } } maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <path d="M24 0H0V24H24V0Z" fill="white" />
      </mask>
      <g mask="url(#mask0_191_9328)">
        <path d="M19.3852 2.40472C21.2873 2.50108 22.8 4.07389 22.8 6.00002V13.2H21.3V6.00002C21.3 4.84022 20.3598 3.90002 19.2 3.90002H4.80001C3.64021 3.90002 2.70001 4.84022 2.70001 6.00002V15.6C2.70001 16.7598 3.64021 17.7 4.80001 17.7H13.2V19.2H4.80001C2.87388 19.2 1.30106 17.6873 1.2047 15.7852L1.20001 15.6V6.00002C1.20001 4.0118 2.81179 2.40002 4.80001 2.40002H19.2L19.3852 2.40472Z" fill="currentColor" />
        <path d="M15.9273 22.8C15.8405 22.8 15.7572 22.7579 15.6959 22.6829C15.6345 22.6079 15.6 22.5061 15.6 22.4V13.6001C15.6 13.5305 15.6148 13.4622 15.643 13.4018C15.6712 13.3415 15.7118 13.2911 15.7607 13.2557C15.8097 13.2203 15.8654 13.2011 15.9222 13.2C15.9791 13.1989 16.0352 13.216 16.0851 13.2496L22.6305 17.6495C22.6818 17.684 22.7247 17.7348 22.7544 17.7964C22.7843 17.858 22.8 17.9284 22.8 18C22.8 18.0716 22.7843 18.142 22.7544 18.2036C22.7247 18.2652 22.6818 18.316 22.6305 18.3505L16.0851 22.7504C16.0367 22.783 15.9825 22.8 15.9273 22.8Z" fill="currentColor" />
      </g>
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="output__empty-state">
      <div className="output__empty-state-icon" aria-hidden="true"><PlayIcon /></div>
      <p className="output__empty-state-text">Result will appear here after you run the test.</p>
    </div>
  );
}

/**
 * Get the waiting context describing what the execution is currently blocked on.
 * Returns null if nothing is being waited on.
 *
 * @param {ExecutionLogEntry[]} [entries]
 * @param {string} [tasklistBaseUrl]
 * @param {string|null} [currentOperateUrl]
 *
 * @returns {{ title: string, description: React.ReactNode, linkUrl: string|null, linkLabel: string } | null}
 */
export function getWaitingContext(entries, tasklistBaseUrl, currentOperateUrl) {
  if (!entries || !entries.length) {
    return null;
  }

  const terminalUserTaskKeys = new Set(
    /** @type {ExecutionLogUserTaskEntry[]} */ (entries
      .filter(entry => entry.type === EXECUTION_LOG_ENTRY_TYPE.USER_TASK
        && entry.data.state !== 'CREATED'))
      .map(entry => entry.data.userTaskKey)
  );

  const pendingUserTask = /** @type {ExecutionLogUserTaskEntry|undefined} */ (entries.find(
    entry => entry.type === EXECUTION_LOG_ENTRY_TYPE.USER_TASK
      && entry.data.state === 'CREATED'
      && !terminalUserTaskKeys.has(entry.data.userTaskKey)
  ));

  if (pendingUserTask) {
    const name = pendingUserTask.data.name || pendingUserTask.data.elementId;
    const tasklistUrl = getTasklistUrl(tasklistBaseUrl || '', pendingUserTask.data.userTaskKey || '');

    return {
      title: 'Waiting for user task completion',
      description: name
        ? <>Complete the <span className="output__banner-tag">{ name }</span> user task to continue the test execution.</>
        : 'Complete the user task to continue the test execution.',
      linkUrl: tasklistUrl || null,
      linkLabel: 'Open in Tasklist'
    };
  }

  const correlatedSubscriptionKeys = new Set(
    /** @type {ExecutionLogMessageSubscriptionEntry[]} */ (entries
      .filter(entry => entry.type === EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION
        && entry.data.messageSubscriptionState !== 'CREATED'))
      .map(entry => entry.data.messageSubscriptionKey)
  );

  const activeSubscription = /** @type {ExecutionLogMessageSubscriptionEntry|undefined} */ (entries.find(
    entry => entry.type === EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION
      && entry.data.messageSubscriptionState === 'CREATED'
      && !correlatedSubscriptionKeys.has(entry.data.messageSubscriptionKey)
  ));

  if (activeSubscription) {
    const messageName = activeSubscription.data.messageName;

    return {
      title: 'Waiting for message correlation',
      description: messageName
        ? <>Ensure the <span className="output__banner-tag">{ messageName }</span> message is correlated to continue the test execution.</>
        : 'Ensure the required message is correlated to continue the test execution.',
      linkUrl: currentOperateUrl || null,
      linkLabel: 'Open in Operate'
    };
  }

  const terminalJobKeys = new Set(
    /** @type {ExecutionLogJobEntry[]} */ (entries
      .filter(entry => entry.type === EXECUTION_LOG_ENTRY_TYPE.JOB
        && entry.data.state !== 'CREATED'))
      .map(entry => entry.data.jobKey)
  );

  const pendingJob = /** @type {ExecutionLogJobEntry|undefined} */ (entries.find(
    entry => entry.type === EXECUTION_LOG_ENTRY_TYPE.JOB
      && entry.data.state === 'CREATED'
      && !terminalJobKeys.has(entry.data.jobKey)
  ));

  if (pendingJob) {
    const jobType = pendingJob.data.type;

    return {
      title: 'Waiting for job completion',
      description: jobType
        ? <>Ensure the <span className="output__banner-tag">{ jobType }</span> job is completed to continue the test execution.</>
        : 'Ensure the corresponding job is completed to continue the test execution.',
      linkUrl: currentOperateUrl || null,
      linkLabel: 'Open in Operate'
    };
  }

  return null;
}

function ExecutingBanner({ currentOperateUrl, entries, tasklistBaseUrl }) {
  const waitingContext = getWaitingContext(entries, tasklistBaseUrl, currentOperateUrl);

  return (
    <div className="output__banner output__banner--executing">
      <div className="output__banner-header">
        <div className="output__banner-main">
          <InlineLoading className="output__banner-loader" />
          <span className="output__banner-text">
            { waitingContext ? waitingContext.title : 'Running test...' }
          </span>
        </div>
        { currentOperateUrl && (
          <Link
            className="output__banner-operate-link"
            href={ currentOperateUrl }
            target="_blank"
            renderIcon={ Launch }
          >
            Open in Operate
          </Link>
        ) }
      </div>
      { waitingContext && (
        <div className="output__banner-details">
          { waitingContext.description && (
            <p className="output__banner-details-content">{ waitingContext.description }</p>
          ) }
          { waitingContext.linkUrl && waitingContext.linkUrl !== currentOperateUrl && (
            <Link
              className="output__banner-details-link"
              href={ waitingContext.linkUrl }
              target="_blank"
              renderIcon={ Launch }
            >
              { waitingContext.linkLabel }
            </Link>
          ) }
        </div>
      ) }
    </div>
  );
}

function ResultBanner({
  bannerVariant,
  statusIcon,
  timingText,
  output,
  onResetOutput,
  isConnectionConfigured,
  currentOperateUrl,
  element,
  isTaskExecuting
}) {
  const headerText = useMemo(() => {
    if (output) {
      if (output.error) {
        return output.error ? `Error: ${output?.error?.message}` : 'Error';
      }

      if (output.incident) {
        return output.incident.errorType ? `Incident: ${output.incident.errorType}` : 'Incident';
      }

      if (output.success) {
        return 'Test completed';
      }

      if (output.terminated) {
        return 'Process instance terminated';
      }

      if (output.canceled) {
        return 'Test canceled';
      }
    }

    return null;
  }, [ output ]);

  const detailsContent = useMemo(() => {
    if (output?.success) {
      return 'See output variables below.';
    }

    if (output?.terminated) {
      return 'The process instance was terminated before the test could complete. This might be the expected behavior.';
    }

    if (output?.canceled) {
      return 'The test was manually canceled.';
    }

    return null;
  }, [ output ]);

  const incidentDetails = useMemo(() => {
    if (output?.incident) {
      return getIncidentDetails(output.incident);
    }
    return null;
  }, [ output ]);

  const isError = output?.error || output?.incident;
  const [ detailsExpanded, setDetailsExpanded ] = useState(true);

  return (
    <div className={ `output__banner output__banner--${bannerVariant}` }>
      <div className="output__banner-header" onClick={ isError ? () => setDetailsExpanded(!detailsExpanded) : undefined }>
        <div className="output__banner-main">
          <span className="output__banner-icon">{ statusIcon }</span>
          <span className="output__banner-text">{ headerText }</span>
        </div>
        { timingText && <span className="output__banner-timing">{ timingText }</span> }
        { isError && (
          detailsExpanded ? <ChevronDown size={ 16 } className="output__banner-chevron output__banner-chevron--open" />
            : <ChevronRight size={ 16 } className="output__banner-chevron" />
        ) }
      </div>
      { detailsExpanded && detailsContent && (
        <div className="output__banner-details">
          <div className="output__banner-details-content">{ detailsContent }</div>
        </div>
      ) }
      {
        detailsExpanded && output?.error && (
          <div className="output__banner-details">
            <div className="output__banner-error">
              <Tooltip className="has-tooltip" label={ <span>Details about the error that occurred during task execution</span> } align="bottom-start">
                <span className="output__banner-error-heading">Error details</span>
              </Tooltip>
              <div className="output__banner-details-content">
                <div className="output__banner-details-row">
                  <dt className="output__banner-details-label">Message</dt>
                  <dd className="output__banner-details-value">{ output.error?.message || 'No error message available' }</dd>
                </div>
                { output.error?.detail && (
                  <div className="output__banner-details-row">
                    <dt className="output__banner-details-label">Detail</dt>
                    <dd className="output__banner-details-value">{ output.error.detail }</dd>
                  </div>
                ) }
                { output.error?.errorType && (
                  <div className="output__banner-details-row">
                    <dt className="output__banner-details-label">Error type</dt>
                    <dd className="output__banner-details-value">{ output.error.errorType }</dd>
                  </div>
                ) }
                { output.error?.status != null && (
                  <div className="output__banner-details-row">
                    <dt className="output__banner-details-label">Status</dt>
                    <dd className="output__banner-details-value">{ output.error.status }</dd>
                  </div>
                ) }
                { output.error?.response && (
                  <div className="output__banner-details-row">
                    <dt className="output__banner-details-label">Response</dt>
                    <dd className="output__banner-details-value">{ output.error.response }</dd>
                  </div>
                ) }
              </div>
            </div>
          </div>
        )
      }
      { detailsExpanded && incidentDetails && (
        <div className="output__banner-details">
          <div className="output__banner-incident">
            <Tooltip className="has-tooltip" label={ <span>Details about the incident that occurred during task execution <Link
              href="https://docs.camunda.io/docs/components/concepts/incidents/"
              target="_blank"
              rel="noopener noreferrer"
            >Learn more.</Link></span> } align="bottom-start">
              <span className="output__banner-incident-heading">Incident details</span>
            </Tooltip>
            <div className="output__banner-details-content">
              { incidentDetails.map(({ label, value }, i) => (
                <div key={ i } className="output__banner-details-row">
                  <dt className="output__banner-details-label">{ label }</dt>
                  <dd className="output__banner-details-value">{ value }</dd>
                </div>
              )) }
            </div>
          </div>
        </div>
      ) }
      <div className="output__banner-actions">
        <OperateLink />
        <HeaderLinks
          onResetOutput={ onResetOutput }
          isConnectionConfigured={ isConnectionConfigured }
          currentOperateUrl={ currentOperateUrl }
          element={ element }
          output={ output }
          isTaskExecuting={ isTaskExecuting }
        />
      </div>
    </div>
  );
}

function getIncidentDetails(incident) {
  const {
    errorType,
    errorMessage,
    creationTime,
    ...rest
  } = incident;

  const details = [];

  if (errorType) {
    details.push({ label: 'Type', value: errorType });
  }

  if (creationTime) {
    details.push({ label: 'Creation Time', value: new Date(creationTime).toLocaleString() });
  }

  if (errorMessage) {
    details.push({ label: 'Message', value: errorMessage });
  }

  Object.entries(rest).forEach(([ key, value ]) => {
    details.push({ label: capitalize(key), value: String(value) });
  });

  return details;
}

/**
 * Capitalize a string, adding spaces before capital letters.
 *
 * @param {string} string
 * @returns {string}
 */
function capitalize(string) {
  return string.replace(/([A-Z])/g, ' $1').replace(/^./, (match) => match.toUpperCase());
}

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.tooltip]
 * @param {boolean} [props.defaultOpen]
 * @param {boolean} [props.isExecuting]
 * @param {string} [props.collapsedHint]
 * @param {React.ReactNode} props.children
 */
function CollapsibleSection({ title, tooltip, defaultOpen = true, isExecuting = false, collapsedHint, children }) {
  const [ isOpen, setIsOpen ] = useState(defaultOpen);
  const [ isStuck, setIsStuck ] = useState(false);

  /** @type {React.MutableRefObject<HTMLDivElement|null>} */
  const sentinelRef = useRef(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const scrollParent = el.closest('.task-testing-tabs__panel') || el.closest('.task-testing__container--body-executing');
    if (!scrollParent) return;

    const observer = new IntersectionObserver(
      ([ entry ]) => {
        setIsStuck(!entry.isIntersecting);
      },
      { root: scrollParent, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={ `output__collapsible${isOpen ? ' output__collapsible--open' : ''}` }>
      <div ref={ sentinelRef } className="output__collapsible-sentinel" />
      <button
        className={ `output__collapsible-header${isStuck ? ' stuck' : ''}` }
        onClick={ () => setIsOpen(!isOpen) }
      >
        {
          isOpen ? <ChevronDown size={ 16 } className="output__chevron output__chevron--open" />
            : <ChevronRight size={ 16 } className="output__chevron" />
        }
        { tooltip ? (
          <Tooltip className="has-tooltip" label={ tooltip } align="bottom-start">
            <span className="output__collapsible-title">{ title }</span>
          </Tooltip>
        ) : (
          <span className="output__collapsible-title">{ title }</span>
        ) }
        { !isOpen && collapsedHint && (
          <span className="output__collapsible-hint">{ collapsedHint }</span>
        ) }
      </button>
      { isOpen && (
        <div className="output__collapsible-content">
          { children }
        </div>
      ) }
    </div>
  );
}

function VariablesSection({ title, tooltip, scope, output, currentVariables, isTaskExecuting, element, onAddToExampleData, onAppendOutputMapping }) {
  const isLoading = isTaskExecuting && !currentVariables;

  const variables = useMemo(() => {

    // During execution, show current variables
    if (isTaskExecuting && currentVariables && Object.keys(currentVariables).length > 0) {
      return pickVariables(currentVariables, scope);
    }

    // After execution, show variables from output
    if (output && output.variables) {
      return pickVariables(output.variables, scope);
    }

    return null;
  }, [ isTaskExecuting, currentVariables, output, scope ]);

  const isEmpty = !variables || Object.keys(variables).length === 0;
  const jsonValue = isEmpty ? '' : JSON.stringify(variables, null, 2);

  return (
    <CollapsibleSection title={ title } tooltip={ tooltip } defaultOpen={ true } isExecuting={ isTaskExecuting }>
      { isLoading ? (
        <div className="output__variables--skeleton">
          <SkeletonPlaceholder />
        </div>
      ) : (
        <OutputEditor
          value={ isEmpty ? '{}' : jsonValue }
          element={ element }
          onAddToExampleData={ onAddToExampleData }
          onAppendOutputMapping={ onAppendOutputMapping }
        />
      ) }
    </CollapsibleSection>
  );
}
