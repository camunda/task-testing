/**
 * @import {
 *   Element
 * } from 'bpmn-js/lib/model/Types';
 *
 * @import {
 *   ElementOutput,
 *   ExecutionLogEntry,
 *   ExecutionLogElementInstanceEntry,
 *   ExecutionLogJobEntry,
 *   ExecutionLogUserTaskEntry,
 *   ExecutionLogMessageSubscriptionEntry,
 *   TaskExecutionState
 * } from '../../types';
 */

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@camunda/design-system';

import {
  CircleCheck,
  ChevronDown,
  ChevronRight,
  CircleX,
  ExternalLink as Launch,
  Info,
  CircleStop,
  Trash2,
  TriangleAlert
} from 'lucide-react';

import { isFunction } from 'min-dash';

import OutputEditor from './OutputEditor';
import { ExecutionLog, formatDuration } from './ExecutionLog';
import { PluginContext } from '../shared/plugins';
import Tooltip from '../shared/Tooltip';
import Link from '../shared/Link';
import Spinner from '../shared/Spinner';
import Skeleton from '../shared/Skeleton';
import { SCOPES, pickVariables } from '../../utils/variables';
import { EXECUTION_LOG_ENTRY_STATUS, EXECUTION_LOG_ENTRY_TYPE } from '../../ExecutionLog';
import { TASK_EXECUTION_STATE } from '../../TaskExecution';
import { getOperateUrl } from '../../utils/getOperateUrl';
import { getTasklistUrl } from '../../utils/getTasklistUrl';

/**
 * The run card. Renders the status of the current or last run as a pinned
 * card with strips (variables, timeline, plugin output) inside it.
 *
 * @param {Object} props
 * @param {Element} props.element
 * @param {boolean} props.isConnectionConfigured
 * @param {string} [props.errorBannerTitle='Error']
 * @param {Function} [props.onConfigure]
 * @param {string|null} [props.inputError]
 * @param {string|null} props.currentOperateUrl
 * @param {boolean} props.isTaskExecuting
 * @param {ElementOutput} props.output
 * @param {Function} props.onResetOutput
 * @param {TaskExecutionState} props.taskExecutionState
 * @param {ExecutionLogEntry[]} props.executionLog
 * @param {string} [props.operateBaseUrl]
 * @param {string} [props.tasklistBaseUrl]
 * @param {Object} [props.currentVariables]
 * @param {number|null} [props.executionStartedAt] - Timestamp the current run was started at
 */
export default function Output({
  element,
  isConnectionConfigured,
  errorBannerTitle = 'Error',
  onConfigure,
  inputError,
  isTaskExecuting,
  output,
  currentOperateUrl,
  onResetOutput,
  taskExecutionState,
  executionLog,
  operateBaseUrl,
  tasklistBaseUrl,
  currentVariables,
  executionStartedAt
}) {

  const waitingContext = useMemo(() => {
    if (!isTaskExecuting) {
      return null;
    }

    return getWaitingContext(executionLog, tasklistBaseUrl, currentOperateUrl, operateBaseUrl);
  }, [ isTaskExecuting, executionLog, tasklistBaseUrl, currentOperateUrl, operateBaseUrl ]);

  const [ elapsedMs, setElapsedMs ] = useState(/** @type {number|null} */ (null));

  // Live elapsed timer while a run is executing
  useEffect(() => {
    if (!isTaskExecuting || !executionStartedAt) {
      setElapsedMs(null);

      return;
    }

    const tick = () => setElapsedMs(Date.now() - executionStartedAt);

    tick();

    const interval = setInterval(tick, 100);

    return () => clearInterval(interval);
  }, [ isTaskExecuting, executionStartedAt ]);

  const durationText = useMemo(() => {
    if (isTaskExecuting) {
      return elapsedMs !== null ? formatDuration(elapsedMs) : null;
    }

    if (output?.startedAt && output?.finishedAt) {
      return formatDuration(output.finishedAt - output.startedAt);
    }

    return null;
  }, [ isTaskExecuting, elapsedMs, output ]);

  const hasRunError = !!(output?.incident || output?.error);

  // A run only exists once the process instance was started; deploy/start
  // failures render no strips
  const hasStartedInstance = useMemo(() => {
    return (executionLog || []).some(entry =>
      entry.type === EXECUTION_LOG_ENTRY_TYPE.STATUS
      && entry.status === EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED
    );
  }, [ executionLog ]);

  if (isTaskExecuting) {
    return (
      <ExecutingCard
        currentOperateUrl={ currentOperateUrl }
        currentVariables={ currentVariables }
        duration={ durationText }
        element={ element }
        executionLog={ executionLog }
        isTaskExecuting={ isTaskExecuting }
        output={ output }
        taskExecutionState={ taskExecutionState }
        waitingContext={ waitingContext }
      />
    );
  }

  if (output) {
    return (
      <ResultCard
        currentOperateUrl={ currentOperateUrl }
        currentVariables={ currentVariables }
        duration={ durationText }
        element={ element }
        executionLog={ executionLog }
        hasRunError={ hasRunError }
        hasStartedInstance={ hasStartedInstance }
        isConnectionConfigured={ isConnectionConfigured }
        isTaskExecuting={ isTaskExecuting }
        onResetOutput={ onResetOutput }
        output={ output }
      />
    );
  }

  if (!isConnectionConfigured) {
    return (
      <ConnectionErrorCard
        title={ errorBannerTitle }
        onConfigure={ onConfigure }
      />
    );
  }

  if (inputError) {
    return <IdlePlaceholder muted text="Fix the input to run a test." />;
  }

  return <IdlePlaceholder text="No run yet. Results appear here." />;
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
 * @param {number} [props.priority=1000] - Priority for sorting (higher values first)
 * @returns {null}
 */
const DEFAULT_RENDER = /** @type {(props?: any) => React.ReactNode} */ (() => null);

export const HeaderLink = ({ children = null, render = DEFAULT_RENDER, visible, href, target, className, onClick = undefined, renderIcon, role = undefined, tooltip, priority = 1000 }) => {
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

function IdlePlaceholder({ muted = false, text }) {
  return (
    <div className="output">
      <div className={ `output__placeholder${muted ? ' output__placeholder--muted' : ''}` }>
        <Info size={ 18 } aria-hidden="true" />
        <span>{ text }</span>
      </div>
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
 * @param {string} [operateBaseUrl]
 *
 * @returns {{ title: string, description: React.ReactNode, linkUrl: string|null, linkLabel: string, primaryLink?: boolean } | null}
 */
export function getWaitingContext(entries, tasklistBaseUrl, currentOperateUrl, operateBaseUrl) {
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
      title: 'Waiting for user task',
      description: name
        ? <>Complete <span className="run-card__tag">{ name }</span> to continue.</>
        : 'Complete the user task to continue.',
      linkUrl: tasklistUrl || null,
      linkLabel: 'Open in Tasklist',
      primaryLink: true
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
      title: 'Waiting for message',
      description: messageName
        ? <>Correlate <span className="run-card__tag">{ messageName }</span> to continue.</>
        : 'Correlate the message to continue.',
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
      title: 'Waiting for job',
      description: jobType
        ? <>No worker has picked up <span className="run-card__tag">{ jobType }</span>.</>
        : 'No worker has picked up the job.',
      linkUrl: currentOperateUrl || null,
      linkLabel: 'Open in Operate'
    };
  }

  const terminalCallActivityKeys = new Set(
    /** @type {ExecutionLogElementInstanceEntry[]} */ (entries
      .filter(entry => entry.type === EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE
        && entry.data.type === 'CALL_ACTIVITY'
        && entry.data.state !== 'ACTIVE'))
      .map(entry => entry.data.elementInstanceKey)
  );

  const activeCallActivity = /** @type {ExecutionLogElementInstanceEntry|undefined} */ (entries.find(
    entry => entry.type === EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE
      && entry.data.type === 'CALL_ACTIVITY'
      && entry.data.state === 'ACTIVE'
      && !terminalCallActivityKeys.has(entry.data.elementInstanceKey)
  ));

  if (activeCallActivity) {
    const name = activeCallActivity.data.elementName || activeCallActivity.data.elementId;
    const childProcessInstanceKey = activeCallActivity.data.childProcessInstanceKey;

    const childProcessUrl = operateBaseUrl && childProcessInstanceKey
      ? getOperateUrl(operateBaseUrl, childProcessInstanceKey)
      : null;

    return {
      title: 'Waiting for called process',
      description: name
        ? <><span className="run-card__tag">{ name }</span> has not completed.</>
        : 'The called process has not completed.',
      linkUrl: childProcessUrl,
      linkLabel: 'Open called process'
    };
  }

  return null;
}

/**
 * Pinned card representing the current or last run. Everything the run
 * produced lives inside it as strips.
 *
 * @param {Object} props
 * @param {'info'|'success'|'error'|'warning'|'canceled'} props.accent
 * @param {React.ReactNode} props.icon
 * @param {string} props.title
 * @param {string|null} [props.duration]
 * @param {string|null} [props.meta]
 * @param {React.ReactNode} [props.description]
 * @param {{ label: string, value: string }[]|null} [props.detailRows]
 * @param {React.ReactNode} [props.links]
 * @param {React.MouseEventHandler<HTMLButtonElement>} [props.onClear]
 * @param {React.ReactNode} [props.strips]
 */
function RunCard({ accent, icon, title, duration, meta, description, detailRows, links, onClear, strips }) {
  return (
    <div className="output">
      <div className={ `run-card run-card--${accent}` }>
        <div className="run-card__header">
          <span className="run-card__icon">{ icon }</span>
          <div className="run-card__header-main">
            <div className="run-card__title-row">
              <span className="run-card__title">{ title }</span>
              { duration && <span className="run-card__duration">{ duration }</span> }
            </div>
            { meta && <p className="run-card__meta">{ meta }</p> }
            { description && <p className="run-card__description">{ description }</p> }
            { detailRows && (
              <dl className="run-card__details">
                { detailRows.map(({ label, value }, index) => (
                  <div key={ index } className="run-card__details-row">
                    <dt className="run-card__details-label">{ label }</dt>
                    <dd className="run-card__details-value">{ value }</dd>
                  </div>
                )) }
              </dl>
            ) }
            { links && <div className="run-card__links">{ links }</div> }
          </div>
          { onClear && (
            <Tooltip label="Delete result" align="bottom-end">
              <button
                type="button"
                className="run-card__clear"
                aria-label="Delete result"
                onClick={ onClear }
              >
                <Trash2 size={ 15 } aria-hidden="true" />
              </button>
            </Tooltip>
          ) }
        </div>
        { strips && <div className="run-card__strips">{ strips }</div> }
      </div>
    </div>
  );
}

function ConnectionErrorCard({ title, onConfigure }) {
  return (
    <div className="output">
      <div className="run-card run-card--error">
        <div className="run-card__header">
          <span className="run-card__icon"><TriangleAlert size={ 18 } aria-hidden="true" /></span>
          <div className="run-card__header-main">
            <div className="run-card__title-row">
              <span className="run-card__title">{ title }</span>
            </div>
            <p className="run-card__description">Connect a Camunda 8 cluster to run tests from the modeler.</p>
            { onConfigure && (
              <div className="run-card__actions">
                <Button variant="secondary" size="sm" onClick={ onConfigure }>Configure connection</Button>
              </div>
            ) }
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutingCard({
  currentOperateUrl,
  currentVariables,
  duration,
  element,
  executionLog,
  isTaskExecuting,
  output,
  taskExecutionState,
  waitingContext
}) {

  const title = useMemo(() => {
    if (waitingContext) {
      return waitingContext.title;
    }

    if (taskExecutionState === TASK_EXECUTION_STATE.DEPLOYING) {
      return 'Deploying process';
    }

    if (taskExecutionState === TASK_EXECUTION_STATE.STARTING_INSTANCE) {
      return 'Starting process instance';
    }

    return 'Running test';
  }, [ waitingContext, taskExecutionState ]);

  const meta = !waitingContext && taskExecutionState !== TASK_EXECUTION_STATE.DEPLOYING
    ? 'Process deployed.'
    : null;

  const links = [];

  if (waitingContext?.linkUrl) {
    links.push(
      <Link
        key="waiting"
        className={ waitingContext.primaryLink ? 'run-card__link--primary' : undefined }
        href={ waitingContext.linkUrl }
        target="_blank"
        renderIcon={ Launch }
      >
        { waitingContext.linkLabel }
      </Link>
    );
  }

  if (currentOperateUrl && currentOperateUrl !== waitingContext?.linkUrl) {
    links.push(
      <Link
        key="operate"
        href={ currentOperateUrl }
        target="_blank"
        renderIcon={ Launch }
      >
        Open in Operate
      </Link>
    );
  }

  return (
    <RunCard
      accent="info"
      icon={ <Spinner size={ 18 } /> }
      title={ title }
      duration={ duration }
      meta={ meta }
      description={ waitingContext?.description }
      links={ links.length ? links : null }
      strips={ <>
        <VariablesStrip
          output={ output }
          currentVariables={ currentVariables }
          isTaskExecuting={ isTaskExecuting }
          defaultOpen={ !waitingContext }
        />
        <TimelineStrip
          entries={ executionLog }
          isTaskExecuting={ isTaskExecuting }
          hasError={ false }
        />
        <PluginStrips
          element={ element }
          output={ output }
          isTaskExecuting={ isTaskExecuting }
          executionLog={ executionLog }
        />
      </> }
    />
  );
}

function ResultCard({
  currentOperateUrl,
  currentVariables,
  duration,
  element,
  executionLog,
  hasRunError,
  hasStartedInstance,
  isConnectionConfigured,
  isTaskExecuting,
  onResetOutput,
  output
}) {

  const accent = output.error || output.incident
    ? 'error'
    : output.success
      ? 'success'
      : output.terminated
        ? 'warning'
        : 'canceled';

  const icon = output.error || output.incident
    ? <TriangleAlert size={ 18 } aria-hidden="true" />
    : output.success
      ? <CircleCheck size={ 18 } aria-hidden="true" />
      : output.terminated
        ? <CircleStop size={ 18 } aria-hidden="true" />
        : <CircleX size={ 18 } aria-hidden="true" />;

  const title = output.error
    ? 'Could not start test'
    : output.incident
      ? 'Incident'
      : output.success
        ? 'Test completed'
        : output.terminated
          ? 'Instance terminated'
          : 'Test canceled';

  const description = output.terminated
    ? 'Terminated before the test could complete. This may be expected.'
    : output.canceled
      ? 'You stopped the test. Partial results kept below.'
      : null;

  const meta = useMemo(() => {
    if (!output.success || !output.finishedAt) {
      return null;
    }

    const time = new Date(output.finishedAt).toLocaleTimeString([], { hour12: false });

    const processVariables = output.variables ? pickVariables(output.variables, SCOPES.PROCESS) : {};

    const count = Object.keys(processVariables).length;

    return `${time} · ${count} ${count === 1 ? 'variable' : 'variables'} in`;
  }, [ output ]);

  const detailRows = useMemo(() => {
    if (output.incident) {
      return getIncidentDetails(output.incident);
    }

    if (output.error) {
      return getErrorDetails(output.error);
    }

    return null;
  }, [ output ]);

  // Deploy/start failures have no run, so no strips are rendered
  const showStrips = !output.error || hasStartedInstance;

  return (
    <RunCard
      accent={ accent }
      icon={ icon }
      title={ title }
      duration={ duration }
      meta={ meta }
      description={ description }
      detailRows={ detailRows }
      links={ <>
        <OperateLink />
        <HeaderLinks
          onResetOutput={ onResetOutput }
          isConnectionConfigured={ isConnectionConfigured }
          currentOperateUrl={ currentOperateUrl }
          element={ element }
          output={ output }
          isTaskExecuting={ isTaskExecuting }
        />
      </> }
      onClear={ onResetOutput }
      strips={ showStrips ? <>
        <VariablesStrip
          output={ output }
          currentVariables={ currentVariables }
          isTaskExecuting={ isTaskExecuting }
          defaultOpen={ !!output.success }
        />
        <TimelineStrip
          entries={ executionLog }
          isTaskExecuting={ isTaskExecuting }
          hasError={ hasRunError }
        />
        <PluginStrips
          element={ element }
          output={ output }
          isTaskExecuting={ isTaskExecuting }
          executionLog={ executionLog }
        />
      </> : null }
    />
  );
}

/**
 * @param {import('../../types').TaskExecutionError} error
 *
 * @returns {{ label: string, value: string }[]}
 */
function getErrorDetails(error) {
  const details = [
    { label: 'Message', value: error?.message || 'No error message available' }
  ];

  if (error?.detail) {
    details.push({ label: 'Detail', value: error.detail });
  }

  if (error?.errorType) {
    details.push({ label: 'Error type', value: error.errorType });
  }

  if (error?.status != null) {
    details.push({ label: 'Status', value: String(error.status) });
  }

  if (error?.response) {
    details.push({ label: 'Response', value: error.response });
  }

  return details;
}

/**
 * A collapsible strip inside the run card.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {boolean} [props.live=false] - Whether to show a `live` marker next to the label
 * @param {string} [props.count] - Trailing count label (e.g. `3 events`)
 * @param {boolean} [props.countError=false] - Whether to render the count in error color
 * @param {boolean} [props.defaultOpen=false]
 * @param {React.ReactNode} [props.headerContent] - Content rendered on the right side of the header (e.g. scope toggle)
 * @param {boolean} [props.fullBleed=false] - Whether the body breaks the card's inset (foreign HTML)
 * @param {React.MouseEventHandler<HTMLButtonElement>} [props.onOpenExternal] - If provided, renders a button that opens the content in its own window
 * @param {React.ReactNode} props.children
 */
function RunStrip({ label, live = false, count, countError = false, defaultOpen = false, headerContent, fullBleed = false, onOpenExternal, children }) {
  const [ isOpen, setIsOpen ] = useState(defaultOpen);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [ defaultOpen ]);

  return (
    <Collapsible
      className="run-card__strip"
      open={ isOpen }
      onOpenChange={ setIsOpen }
    >
      <div className="run-card__strip-header">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="run-card__strip-toggle"
          >
            <span className="run-card__strip-chevron">
              { isOpen ? <ChevronDown size={ 14 } /> : <ChevronRight size={ 14 } /> }
            </span>
            <span className="run-card__strip-label">{ label }</span>
            { live && <span className="run-card__strip-live">live</span> }
          </button>
        </CollapsibleTrigger>
        { headerContent }
        { onOpenExternal && (
          <button
            type="button"
            className="run-card__strip-external"
            aria-label={ `Open ${label} in new window` }
            onClick={ onOpenExternal }
          >
            <Launch size={ 14 } aria-hidden="true" />
          </button>
        ) }
        { count && (
          <span className={ `run-card__strip-count${countError ? ' run-card__strip-count--error' : ''}` }>
            { count }
          </span>
        ) }
      </div>
      <CollapsibleContent
        className={ `run-card__strip-body${fullBleed ? ' run-card__strip-body--full-bleed' : ''}` }
      >
        { children }
      </CollapsibleContent>
    </Collapsible>
  );
}

const PROCESS_SCOPE_TOOLTIP = (
  <span>Variables in the process scope. <a
    href="https://docs.camunda.io/docs/components/concepts/variables/"
    target="_blank"
    rel="noopener noreferrer"
  >Learn more.</a></span>
);

const LOCAL_SCOPE_TOOLTIP = (
  <span>Variables in the scope of the executed element. <a
    href="https://docs.camunda.io/docs/components/concepts/variables/"
    target="_blank"
    rel="noopener noreferrer"
  >Learn more.</a></span>
);

function VariablesStrip({ output, currentVariables, isTaskExecuting, defaultOpen }) {
  const [ scope, setScope ] = useState(/** @type {typeof SCOPES[keyof typeof SCOPES]} */ (SCOPES.PROCESS));

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

  const scopeToggle = (
    <div className="run-card__scope-toggle">
      <Tooltip className="has-tooltip" label={ PROCESS_SCOPE_TOOLTIP } align="bottom-end">
        <button
          type="button"
          className={ `run-card__scope-option${scope === SCOPES.PROCESS ? ' run-card__scope-option--selected' : ''}` }
          aria-pressed={ scope === SCOPES.PROCESS }
          onClick={ () => setScope(SCOPES.PROCESS) }
        >
          Process
        </button>
      </Tooltip>
      <Tooltip className="has-tooltip" label={ LOCAL_SCOPE_TOOLTIP } align="bottom-end">
        <button
          type="button"
          className={ `run-card__scope-option${scope === SCOPES.LOCAL ? ' run-card__scope-option--selected' : ''}` }
          aria-pressed={ scope === SCOPES.LOCAL }
          onClick={ () => setScope(SCOPES.LOCAL) }
        >
          Local
        </button>
      </Tooltip>
    </div>
  );

  return (
    <RunStrip
      label="Variables"
      live={ isTaskExecuting }
      defaultOpen={ defaultOpen }
      headerContent={ scopeToggle }
    >
      { isLoading ? (
        <div className="output__variables--skeleton">
          <Skeleton />
        </div>
      ) : (
        <OutputEditor value={ isEmpty ? '{}' : jsonValue } />
      ) }
    </RunStrip>
  );
}

function TimelineStrip({ entries = [], isTaskExecuting, hasError }) {
  const count = hasError ? '1 error' : `${entries.length} events`;

  return (
    <RunStrip
      label="Timeline"
      defaultOpen={ hasError }
      count={ count }
      countError={ hasError }
    >
      { entries.length > 0 ? (
        <ExecutionLog
          entries={ entries }
          isTaskExecuting={ isTaskExecuting }
        />
      ) : (
        <div className="output__section-empty">Result does not have a log.</div>
      ) }
    </RunStrip>
  );
}

/**
 * Renders plugins registered through `TaskTesting.Tab` (type
 * `output.body.tab`) as strips inside the run card, in priority order.
 * Plugins whose `render()` returns nothing are not rendered at all.
 */
function PluginStrips({ element, output, isTaskExecuting, executionLog }) {
  const { getPlugins } = useContext(PluginContext);

  const strips = getPlugins('output.body.tab')
    .map((plugin, index) => {
      const { fullBleed, onOpenExternal } = plugin;

      return {
        key: `plugin-${index}`,
        label: plugin.label,
        fullBleed: !!fullBleed,
        onOpenExternal: isFunction(onOpenExternal)
          ? () => onOpenExternal({ element, output, isTaskExecuting, executionLog })
          : undefined,
        children: plugin.render?.({ element, output, isTaskExecuting, executionLog }) || plugin.children
      };
    })
    .filter(strip => strip.children);

  if (!strips.length) {
    return null;
  }

  return strips.map(strip => (
    <RunStrip
      key={ strip.key }
      label={ strip.label }
      fullBleed={ strip.fullBleed }
      onOpenExternal={ strip.onOpenExternal }
    >
      { strip.children }
    </RunStrip>
  ));
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


