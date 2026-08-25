/**
 * @import {
 *   Element
 * } from 'bpmn-js/lib/model/Types';
 *
 * @import {
 *   Config,
 *   ElementOutput,
 *   ElementOutputVariables,
 *   ExecutionLogEntry,
 *   TaskExecutionApi,
 *   TaskExecutionFinishedResult,
 *   TaskExecutionIncidentResult,
 *   TaskExecutionErrorResult,
 *   TaskExecutionEventListeners,
 *   TaskExecutionTerminatedResult,
 *   TaskExecutionPolledResult,
 *   TaskExecutionState
 * } from '../../types';
 */

import React, { useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';

import { Button, C4Provider, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@camunda/design-system';

import Tooltip from '../shared/Tooltip';
import Link from '../shared/Link';
import Spinner from '../shared/Spinner';

import {
  ChevronDown,
  ChevronRight,
  MousePointer2 as Cursor,
  Play as PlayFilledAlt,
  Settings,
  CircleStop as StopFilledAlt,
  TriangleAlert
} from 'lucide-react';

import classNames from 'classnames';

import { useSelectedElement } from '../../hooks/useSelectedElement';

import { ElementConfig } from '../../ElementConfig';
import { ElementVariables } from '../../ElementVariables';

import Input from '../Input/Input';
import Output, { HeaderLink } from '../Output/Output';

import TaskExecution, { TASK_EXECUTION_EVENT, TASK_EXECUTION_STATE } from '../../TaskExecution';
import ExecutionLog from '../../ExecutionLog';

import { getVariables } from '../../utils/variables';

import { getOperateUrl } from '../../utils/getOperateUrl';
import { TASK_EXECUTION_FINISHED_REASON } from '../../TaskExecution';

import '../../style/style.scss';
import { PluginContext, usePluginsProviderValue } from '../shared/plugins';

/**
 * @param {Object} props
 * @param {string} props.label - The tab label to display
 * @param {Function} [props.render=() => null] - Function that renders the
 * component
 * @param {React.ReactNode} [props.children] - Static content to render
 * @param {number} [props.priority=1000] - Priority for sorting, higher
 * priority means the tab is rendered left of the lower priority tabs
 * @param {boolean} [props.fullBleed=false] - Whether the tab renders foreign
 * HTML that should be quarantined in a full-bleed, scroll-isolated strip body
 * @param {Function} [props.onOpenExternal] - If provided, the strip header
 * renders a button that opens the content in its own window
 *
 * @returns {null}
 */
const DEFAULT_RENDER = () => null;

const PluginTab = ({ children = null, render = DEFAULT_RENDER, label, priority = 1000, fullBleed = false, onOpenExternal }) => {
  const { registerPlugin, unregisterPlugin } = useContext(PluginContext);

  useEffect(() => {
    const tab = { label, render, children, priority, fullBleed, onOpenExternal, type: 'output.body.tab' };
    registerPlugin(tab);

    return () => {
      unregisterPlugin(tab);
    };
  }, [ children, render, label, priority, fullBleed, onOpenExternal, registerPlugin, unregisterPlugin ]);

  return null;
};

/**
 * @param {TaskExecutionFinishedResult} result
 * @returns {result is TaskExecutionIncidentResult}
 */
function isIncidentResult(result) {
  return !result.success && result.reason === TASK_EXECUTION_FINISHED_REASON.INCIDENT;
}

/**
 * @param {TaskExecutionFinishedResult} result
 * @returns {result is TaskExecutionErrorResult}
 */
function isErrorResult(result) {
  return !result.success && result.reason === TASK_EXECUTION_FINISHED_REASON.ERROR;
}

/**
 * @param {TaskExecutionFinishedResult} result
 * @returns {result is TaskExecutionTerminatedResult}
 */
function isTerminatedResult(result) {
  return !result.success && result.reason === TASK_EXECUTION_FINISHED_REASON.TERMINATED;
}

/**
 * Extract computed variables from the last polled result of a finished
 * task execution (e.g. after user cancellation or selection change).
 *
 * @param {{ lastPolledResult?: TaskExecutionPolledResult | null }} result
 * @param {Element} element
 * @returns {ElementOutputVariables | undefined}
 */
function getVariablesFromLastPolledResult(result, element) {
  const polled = result.lastPolledResult;

  if (!polled?.variablesResponse?.success || !polled?.elementInstancesResponse?.success) {
    return undefined;
  }

  return getVariables(
    polled.variablesResponse.response.items,
    polled.elementInstancesResponse.response.items || [],
    polled.processInstanceKey,
    element.id
  );
}

/**
 * @param {Object} props
 * @param {Object} props.injector
 * @param {TaskExecutionApi} props.api
 * @param {boolean} [props.hasError] - Whether an error is present.
 * @param {string} [props.errorBannerTitle='Error'] - Title to display in the error banner when `hasError` is `true`.
 * @param {string} [props.configureTooltip='Configure'] - Tooltip for the configure button.
 * @param {Function} [props.onConfigure] - Callback invoked when the user
 * clicks on the configure button.
 * @param {(() => boolean | Promise<boolean>)} [props.onTestTask] - Callback
 * invoked when the user clicks on the _Test task_ button. Should return `true`
 * to proceed with task execution or `false` to abort it. Can return a promise
 * resolving to a boolean.
 * @param {Config|undefined} [props.config]
 * @param {(config: Config) => void} [props.onConfigChanged] - Called when the configuration changes
 * @param {string} [props.operateBaseUrl]
 * @param {string} [props.tasklistBaseUrl]
 * @param {string} [props.documentationUrl]
 * @param {(element: Element) => void} [props.onTaskExecutionStarted] - Called with (element) when task execution starts
 * @param {(element: Element, result: TaskExecutionFinishedResult) => void} [props.onTaskExecutionFinished] - Called with (element, result) where result contains success and optional reason for failures
 * @param {React.ReactNode[]} [props.children=[]]
 */
export default function TaskTesting({
  injector,
  api,
  hasError,
  errorBannerTitle = 'Error',
  configureTooltip = 'Configure',
  onConfigure,
  onTestTask,
  config,
  onConfigChanged = () => {},
  operateBaseUrl,
  tasklistBaseUrl,
  documentationUrl,
  onTaskExecutionStarted = () => {},
  onTaskExecutionFinished = () => {},
  children = []
}) {

  /**
   * @type {React.RefObject<ElementVariables?>}
   */
  const elementVariablesRef = useRef(null);

  /**
   * @type {React.RefObject<ElementConfig?>}
   */
  const elementConfigRef = useRef(null);

  const [ variablesForElement, setVariablesForElement ] = useState([]);

  const [ taskExecutionState, setTaskExecutionState ] = useState(/** @type {TaskExecutionState} */ (TASK_EXECUTION_STATE.IDLE));

  /**
   * @type {ReturnType<typeof useState<string>>}
   */
  const [ input, setInput ] = useState();

  /**
   * @type {ReturnType<typeof useState<ElementOutput>>}
   */
  const [ output, setOutput ] = useState();
  const [ allOutputs, setAllOutputs ] = useState({});
  const [ inputError, setInputError ] = useState(null);

  /**
   * Operate URL of the currently executing task, used to link to Operate.
   */
  const [ currentOperateUrl, setCurrentOperateUrl ] = useState(/** @type {string|null} */ (null));

  const [ element, selectionInfo ] = useSelectedElement(injector);

  /**
   * @type {React.RefObject<TaskExecution?>}
   */
  const taskExecutionRef = useRef(null);

  const [ testTaskButtonEnabled, setTestTaskButtonEnabled ] = useState(true);

  /**
   * @type {[ExecutionLogEntry[], Function]}
   */
  const [ executionLog, setExecutionLog ] = useState([]);

  /**  @type {React.RefObject<ExecutionLog>} */
  const executionLogRef = useRef(new ExecutionLog());

  /** @type {React.RefObject<number|null>} */
  const executionStartTimeRef = useRef(null);

  /** @type {[ElementOutputVariables|null, Function]} */
  const [ currentVariables, setCurrentVariables ] = useState(/** @type {ElementOutputVariables|null} */ (null));

  /**
   * Open state of the collapsible groups, keyed by group id. Groups default
   * based on whether a run exists when no explicit value is present.
   *
   * @type {[Record<string, boolean>, React.Dispatch<React.SetStateAction<Record<string, boolean>>>]}
   */
  const [ openGroups, setOpenGroups ] = useState(/** @type {Record<string, boolean>} */ ({}));

  const toggleGroup = useCallback((key, defaultOpen = true) => {
    setOpenGroups(groups => ({ ...groups, [key]: !(groups[key] ?? defaultOpen) }));
  }, []);

  // Number of top-level keys of the parsed input JSON, shown as a summary
  // chip on the collapsed input group header
  const inputVariableCount = useMemo(() => {
    if (!input) {
      return 0;
    }

    try {
      const parsed = JSON.parse(input);

      return parsed && typeof parsed === 'object' ? Object.keys(parsed).length : 0;
    } catch {
      return 0;
    }
  }, [ input ]);

  // Initialize services once the injector is available
  useEffect(() => {
    const elementVariables = new ElementVariables(injector);
    elementVariablesRef.current = elementVariables;

    const elementConfig = new ElementConfig(injector, elementVariables, config);
    elementConfigRef.current = elementConfig;

    const taskExecution = new TaskExecution(injector, api);
    taskExecutionRef.current = taskExecution;

    executionLogRef.current = new ExecutionLog(injector);

    return () => {
      taskExecutionRef.current?.cancelTaskExecution();
    };
  }, [ injector ]);

  // Get input variables for the selected element
  useEffect(() => {
    if (!element || !elementVariablesRef.current) {
      return;
    }

    elementVariablesRef.current.getVariablesForElement(element).then(variables => setVariablesForElement(variables));
  }, [ element ]);

  // Subscribe to `variables.changed` event fired by the Variables Resolver
  useEffect(() => {
    if (!elementVariablesRef.current) {
      return;
    }

    const handleVariablesChanged = async () => {
      if (!element || !elementVariablesRef.current) {
        return;
      }

      const variables = await elementVariablesRef.current.getVariablesForElement(element);

      setVariablesForElement(variables);

      if (elementConfigRef.current) {
        const mergedInput = await elementConfigRef.current.getMergedInputConfigForElement(element);

        // Only update if merge was successful
        if (mergedInput !== null) {
          elementConfigRef.current.setInputConfigForElement(element, mergedInput);
        }
      }
    };

    elementVariablesRef.current.on('variables.changed', handleVariablesChanged);

    return () => {
      if (elementVariablesRef.current) {
        elementVariablesRef.current.off('variables.changed', handleVariablesChanged);
      }
    };
  }, [ element ]);

  // Listen for changes in the config from the modeler
  useEffect(() => {
    if (!elementConfigRef.current) {
      return;
    }

    const handleConfigChanged = () => {
      if (!elementConfigRef.current) {
        return;
      }

      onConfigChanged(elementConfigRef.current.getConfig());

      if (!element) {
        return;
      }

      setInput(elementConfigRef.current.getInputConfigForElement(element));
      setOutput(elementConfigRef.current.getOutputConfigForElement(element));
      setAllOutputs(elementConfigRef.current.getConfig().output);
    };

    elementConfigRef.current.on('config.changed', handleConfigChanged);

    return () => {
      if (elementConfigRef.current) {
        elementConfigRef.current.off('config.changed', handleConfigChanged);
      }
    };
  }, [ element, onConfigChanged, setAllOutputs, setInput, setOutput ]);

  // Subscribe to task execution events
  useEffect(() => {

    /**
     * @type {TaskExecutionEventListeners[typeof TASK_EXECUTION_EVENT.STATE_CHANGED]}
     */
    const handleStateChanged = (state) => {
      setTaskExecutionState(state);

      executionLogRef.current.setState(state, Date.now());

      setExecutionLog(executionLogRef.current.getEntries());
    };

    /**
     * @type {TaskExecutionEventListeners[typeof TASK_EXECUTION_EVENT.DEPLOYED]}
     */
    const handleDeployed = (deployResponse) => {
      executionLogRef.current.setDeployResponse(deployResponse);

      setExecutionLog(executionLogRef.current.getEntries());
    };

    /**
     * @type {TaskExecutionEventListeners[typeof TASK_EXECUTION_EVENT.INSTANCE_STARTED]}
     */
    const handleInstanceStarted = (startInstanceResponse) => {
      if (startInstanceResponse.success) {
        const operateUrl = operateBaseUrl ? getOperateUrl(operateBaseUrl, startInstanceResponse.response.processInstanceKey) : null;

        setCurrentOperateUrl(operateUrl);
      }

      executionLogRef.current.setStartInstanceResponse(startInstanceResponse);

      setExecutionLog(executionLogRef.current.getEntries());
    };

    /**
     * @type {TaskExecutionEventListeners[typeof TASK_EXECUTION_EVENT.POLLED]}
     */
    const handlePolled = (result) => {

      // Compute live variables from poll response if variables and element
      // instances were successfully fetched, otherwise keep previous live
      // variables
      if (result.variablesResponse?.success && result.elementInstancesResponse?.success) {
        const variables = getVariables(
          result.variablesResponse.response.items,
          result.elementInstancesResponse.response.items || [],
          result.processInstanceKey,
          element.id
        );

        setCurrentVariables(variables);
      }

      executionLogRef.current.setPolledResult(result);

      setExecutionLog(executionLogRef.current.getEntries());
    };

    /**
     * @type {TaskExecutionEventListeners[typeof TASK_EXECUTION_EVENT.FINISHED]}
     */
    const handleFinished = (result) => {
      executionLogRef.current.setFinishedResult(result, Date.now());

      setExecutionLog(executionLogRef.current.getEntries());

      const log = executionLogRef.current.getEntries();

      const variables = getVariablesFromLastPolledResult(result, element);

      if (result.success) {
        elementConfigRef?.current?.setOutputConfigForElement(element, {
          success: true,
          variables,
          operateUrl: currentOperateUrl,
          executionLog: log,
          startedAt: executionStartTimeRef.current,
          finishedAt: Date.now()
        });
      } else if (isIncidentResult(result)) {
        elementConfigRef?.current?.setOutputConfigForElement(element, {
          success: false,
          variables,
          incident: result.incident,
          operateUrl: currentOperateUrl,
          executionLog: log,
          startedAt: executionStartTimeRef.current,
          finishedAt: Date.now()
        });
      } else if (isErrorResult(result)) {
        elementConfigRef?.current?.setOutputConfigForElement(element, {
          success: false,
          error: result.error,
          executionLog: log,
          startedAt: executionStartTimeRef.current,
          finishedAt: Date.now()
        });
      } else if (isTerminatedResult(result)) {
        elementConfigRef?.current?.setOutputConfigForElement(element, {
          success: false,
          terminated: true,
          variables,
          operateUrl: currentOperateUrl,
          executionLog: log,
          startedAt: executionStartTimeRef.current,
          finishedAt: Date.now()
        });
      } else if (result.reason === TASK_EXECUTION_FINISHED_REASON.USER_CANCEL
        || result.reason === TASK_EXECUTION_FINISHED_REASON.USER_SELECTION_CHANGED) {
        elementConfigRef?.current?.setOutputConfigForElement(element, {
          success: false,
          canceled: true,
          variables,
          operateUrl: currentOperateUrl,
          executionLog: log,
          startedAt: executionStartTimeRef.current,
          finishedAt: Date.now()
        });
      }

      onTaskExecutionFinished(element, result);
    };

    taskExecutionRef?.current?.on(TASK_EXECUTION_EVENT.FINISHED, handleFinished);
    taskExecutionRef?.current?.on(TASK_EXECUTION_EVENT.DEPLOYED, handleDeployed);
    taskExecutionRef?.current?.on(TASK_EXECUTION_EVENT.INSTANCE_STARTED, handleInstanceStarted);
    taskExecutionRef?.current?.on(TASK_EXECUTION_EVENT.POLLED, handlePolled);
    taskExecutionRef?.current?.on(TASK_EXECUTION_EVENT.STATE_CHANGED, handleStateChanged);

    return () => {
      if (taskExecutionRef.current) {
        taskExecutionRef.current.off(TASK_EXECUTION_EVENT.STATE_CHANGED, handleStateChanged);
        taskExecutionRef.current.off(TASK_EXECUTION_EVENT.DEPLOYED, handleDeployed);
        taskExecutionRef.current.off(TASK_EXECUTION_EVENT.INSTANCE_STARTED, handleInstanceStarted);
        taskExecutionRef.current.off(TASK_EXECUTION_EVENT.POLLED, handlePolled);
        taskExecutionRef.current.off(TASK_EXECUTION_EVENT.FINISHED, handleFinished);
      }
    };
  }, [ element, operateBaseUrl, currentOperateUrl, onTaskExecutionFinished ]);

  useEffect(() => {
    if (config && elementConfigRef.current) {
      if (JSON.stringify(config) !== JSON.stringify(elementConfigRef.current.getConfig())) {
        elementConfigRef.current.setConfig(config);
      }
    }
  }, [ config ]);

  useEffect(() => {

    // Reset group open state so the new element's defaults apply
    setOpenGroups({});

    if (!element) {
      setInput(undefined);

      return;
    }

    elementConfigRef?.current?.getMergedInputConfigForElement(element).then(
      merged => {
        if (merged !== null) {
          setInput(merged);
        } else {
          setInput(elementConfigRef?.current?.getInputConfigForElement(element));
        }
      }
    );
    setOutput(elementConfigRef?.current?.getOutputConfigForElement(element));
  }, [ element ]);

  const pluginsProviderValue = usePluginsProviderValue();

  const handleSetInput = useCallback((newInput) => {
    if (element && elementConfigRef.current) {
      elementConfigRef.current.setInputConfigForElement(element, newInput);
    }
  }, [ element ]);

  const handleResetInput = useCallback(async () => {
    if (element && elementConfigRef.current) {
      const prefilled = await elementConfigRef.current.getDefaultInputForElement(element);
      elementConfigRef.current.setInputConfigForElement(element, prefilled);
    }
  }, [ element ]);

  const handleExecuteTask = async () => {
    if (inputError
      || !element
      || !taskExecutionRef.current
      || !elementConfigRef.current) {
      return;
    }

    onTaskExecutionStarted(element);

    // Collapse the input group to focus on the run card
    setOpenGroups(groups => ({ ...groups, input: false }));

    setExecutionLog([]);
    executionLogRef.current.reset();
    setCurrentVariables(null);
    executionStartTimeRef.current = Date.now();

    const inputConfig = elementConfigRef.current.getInputConfigForElement(element);

    elementConfigRef.current.setOutputConfigForElement(element, null);

    taskExecutionRef.current.executeTask(element, JSON.parse(inputConfig));
  };

  const handleCancelTaskExecution = () => {
    taskExecutionRef?.current?.cancelTaskExecution();
  };

  const handleResetOutput = useCallback(() => {
    if (element && elementConfigRef.current) {
      elementConfigRef.current.resetOutputConfigForElement(element);

      // No run exists after reset, expand the input group
      setOpenGroups(groups => ({ ...groups, input: true }));
    }
  }, [ element ]);

  if (!config) {
    return (
      <C4Provider>
        <div className="task-testing__container task-testing__container--empty">
          <div className="task-testing__container-no-config">
            <Spinner /> <span>Configuring...</span>
          </div>
        </div>
      </C4Provider>
    );
  }

  if (!element && selectionInfo) {
    return (
      <C4Provider>
        <div className="task-testing__container task-testing__container--empty">
          <div className="task-testing__container-no-element">
            <div className="task-testing__no-element-icon" aria-hidden="true">
              <Cursor />
            </div>
            {selectionInfo.title && <h3 className="task-testing__no-element-title">{ selectionInfo.title }</h3>}
            <p className="task-testing__no-element-description">{ selectionInfo.message }</p>
            {documentationUrl && <Link href={ documentationUrl } target="_blank" rel="noopener noreferrer">Learn more</Link>}
          </div>
        </div>
      </C4Provider>
    );
  }

  const showTooltip = hasError || !!inputError;
  const tooltipLabel = hasError ? errorBannerTitle : inputError;

  const isTaskExecuting = taskExecutionState !== TASK_EXECUTION_STATE.IDLE;

  // The input group is expanded when there is no run yet or the input has an
  // error, and collapsed once a run exists
  const inputOpen = openGroups.input ?? (!output || !!inputError);

  const inputBadge = inputError
    ? <TriangleAlert size={ 16 } className="task-testing-group__badge--error" aria-hidden="true" />
    : inputVariableCount > 0
      ? <span className="task-testing-group__badge">{ inputVariableCount } { inputVariableCount === 1 ? 'variable' : 'variables' }</span>
      : null;

  /**
   * Handle clicking the _Test task_ button. If a task is currently executing,
   * it cancels the execution. If no task is executing, it either invokes the
   * `onTestTask` callback (if provided) or proceeds with task execution
   * directly (if the connection is configured). If the `onTestTask` callback
   * is provided, it is expected to return a boolean or a promise that resolves
   * to a boolean - `true` to proceed with task execution or `false` to abort
   * it.
   *
   * @returns {Promise<void>}
   */
  const handleTestTask = async () => {
    if (isTaskExecuting) {

      // cancel task execution
      handleCancelTaskExecution();

      return;
    }

    if (onTestTask) {

      // await result from onTestTask callback and disable _Test task_ button while waiting
      setTestTaskButtonEnabled(false);

      if (await onTestTask()) {
        handleExecuteTask();
      }

      setTestTaskButtonEnabled(true);
    } else if (!hasError) {

      // proceed with task execution
      handleExecuteTask();
    }
  };


  return (
    <C4Provider>
      <PluginContext.Provider value={ pluginsProviderValue }>
        <div className="task-testing__container">
          <div className="task-testing__container--header">
            <div className="task-testing__header-actions">
              { showTooltip ? (
                <Tooltip
                  label={ tooltipLabel }
                  align="bottom-start"
                >
                  <Button
                    data-testid="test-task-btn"
                    className="btn-execute"
                    variant="secondary"
                    size="sm"
                    onClick={ handleTestTask }
                    disabled={ !testTaskButtonEnabled }>
                    { isTaskExecuting ? <StopFilledAlt aria-hidden="true" /> : <PlayFilledAlt aria-hidden="true" /> }
                    {isTaskExecuting ? 'Stop test' : 'Run test'}
                  </Button>
                </Tooltip>
              ) : (
                <Button
                  data-testid="test-task-btn"
                  className="btn-execute"
                  variant={ isTaskExecuting ? 'secondary' : 'default' }
                  size="sm"
                  onClick={ handleTestTask }
                  disabled={ !testTaskButtonEnabled }>
                  { isTaskExecuting ? <StopFilledAlt aria-hidden="true" /> : <PlayFilledAlt aria-hidden="true" /> }
                  {isTaskExecuting ? 'Stop test' : 'Run test'}
                </Button>
              ) }
            </div>
            <div className="task-testing__header-actions-right">
              {
                onConfigure && <Tooltip label={ configureTooltip } align="bottom-end">
                  <Button
                    data-testid="configure-btn"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={ configureTooltip }
                    onClick={ () => onConfigure() }
                    disabled={ isTaskExecuting }
                  >
                    <Settings aria-hidden="true" />
                  </Button>
                </Tooltip>
              }
            </div>
          </div>
          <div className={ `task-testing__container--body${isTaskExecuting ? ' task-testing__container--body-executing' : ''}` }>
            <Output
              element={ element }
              isConnectionConfigured={ !hasError }
              errorBannerTitle={ errorBannerTitle }
              onConfigure={ onConfigure }
              inputError={ inputError }
              isTaskExecuting={ isTaskExecuting }
              currentVariables={ currentVariables }
              output={ output }
              currentOperateUrl={ currentOperateUrl }
              onResetOutput={ handleResetOutput }
              taskExecutionState={ taskExecutionState }
              executionLog={ isTaskExecuting ? executionLog : (output?.executionLog || []) }
              operateBaseUrl={ operateBaseUrl }
              tasklistBaseUrl={ tasklistBaseUrl }
              executionStartedAt={ executionStartTimeRef.current }
            />
            <CollapsibleGroup
              label="Input"
              open={ inputOpen }
              badge={ !inputOpen ? inputBadge : null }
              onToggle={ () => toggleGroup('input', !output || !!inputError) }
            >
              <Input
                allOutputs={ allOutputs }
                input={ input }
                onErrorChange={ setInputError }
                onResetInput={ handleResetInput }
                onSetInput={ handleSetInput }
                variablesForElement={ variablesForElement }
              />
            </CollapsibleGroup>
          </div>
        </div>
        {children}
      </PluginContext.Provider>
    </C4Provider>
  );
}


TaskTesting.Tab = PluginTab;
TaskTesting.Link = HeaderLink;


/**
 * Collapsible group that stacks the task testing sections vertically, similar
 * to the groups in the properties panel.
 *
 * @param {Object} props
 * @param {string} props.label - The group header label.
 * @param {boolean} [props.open=true] - Whether the group is expanded.
 * @param {(open: boolean) => void} [props.onToggle] - Called with the new open state when the group is toggled.
 * @param {React.ReactNode} [props.badge] - Optional badge rendered on the right side of the header.
 * @param {React.ReactNode} props.children - The group content.
 * @returns {React.ReactElement} The rendered collapsible group.
 */
function CollapsibleGroup({ label, open = true, onToggle = () => {}, badge = null, children }) {
  return (
    <Collapsible
      className={ classNames('task-testing-group', { 'task-testing-group--open': open }) }
      open={ open }
      onOpenChange={ onToggle }
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="task-testing-group__header"
        >
          <span className="task-testing-group__toggle">
            { open ? <ChevronDown size={ 16 } /> : <ChevronRight size={ 16 } /> }
          </span>
          <span className="task-testing-group__title">{ label }</span>
          { badge }
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="task-testing-group__content">
        { children }
      </CollapsibleContent>
    </Collapsible>
  );
}

