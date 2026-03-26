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

import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';

import {
  Button,
  InlineLoading,
  Link
} from '@carbon/react';

import Tooltip from '../shared/Tooltip';

import {
  CheckmarkOutline,
  Cursor_1 as Cursor,
  Erase,
  ErrorFilled,
  PlayFilledAlt,
  Settings,
  StopFilledAlt,
  Warning
} from '@carbon/icons-react';

import classNames from 'classnames';

import { useSelectedElement } from '../../hooks/useSelectedElement';

import { ElementConfig } from '../../ElementConfig';
import { ElementVariables } from '../../ElementVariables';

import Input from '../Input/Input';
import Output, { HeaderLink } from '../Output/Output';

import TaskExecution, { TASK_EXECUTION_EVENT, TASK_EXECUTION_STATE } from '../../TaskExecution';
import ExecutionLog from '../../ExecutionLog';

import { getVariables } from '../../utils/variables';
import { isInputEmpty } from '../../utils/prefill';

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
 *
 * @returns {null}
 */
const DEFAULT_RENDER = () => null;

const PluginTab = ({ children = null, render = DEFAULT_RENDER, label, priority = 1000 }) => {
  const { registerPlugin, unregisterPlugin } = useContext(PluginContext);

  useEffect(() => {
    const tab = { label, render, children, priority, type: 'output.body.tab' };
    registerPlugin(tab);

    return () => {
      unregisterPlugin(tab);
    };
  }, [ children, render, label, priority, registerPlugin, unregisterPlugin ]);

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
 * @param {boolean} props.isConnectionConfigured
 * @param {string} [props.configureConnectionBannerTitle]
 * @param {string} [props.configureConnectionLabel]
 * @param {Function} [props.onConfigureConnection] - Callback invoked when
 * the user clicks on the _Configure connection_ button.
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
  isConnectionConfigured,
  configureConnectionBannerTitle = 'Connection required',
  configureConnectionLabel = 'Configure',
  onConfigureConnection,
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

  const [ element, selectedElementMessage ] = useSelectedElement(injector);

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

  const [ selectedTabIndex, setSelectedTabIndex ] = useState(0);

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
        const currentInput = elementConfigRef.current.getInputConfigForElement(element);

        // Only apply the requirements stub if the input is empty
        if (isInputEmpty(currentInput)) {
          const defaultInput = await elementConfigRef.current.getDefaultInputForElement(element);
          elementConfigRef.current.setInputConfigForElement(element, defaultInput);
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
    if (!element) {
      setInput(undefined);

      return;
    }

    const currentInput = elementConfigRef?.current?.getInputConfigForElement(element);
    if (isInputEmpty(currentInput)) {
      elementConfigRef?.current?.getDefaultInputForElement(element).then(
        defaultInput => setInput(defaultInput)
      );
    } else {
      setInput(currentInput);
    }
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

    // Switch to Output tab to show execution progress and results
    setSelectedTabIndex(1);

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

      setSelectedTabIndex(1);
    }
  }, [ element ]);

  if (!config) {
    return (
      <div className="task-testing__container task-testing__container--empty">
        <div className="task-testing__container-no-config">
          <InlineLoading /> <span>Configuring...</span>
        </div>
      </div>
    );
  }

  if (!element) {
    return (
      <div className="task-testing__container task-testing__container--empty">
        <div className="task-testing__container-no-element">
          <Cursor />
          <span>{ selectedElementMessage }</span>
          {documentationUrl && <Link href={ documentationUrl } target="_blank">Learn more</Link>}
        </div>
      </div>
    );
  }

  const showTooltip = !isConnectionConfigured || !!inputError;
  const tooltipLabel = !isConnectionConfigured ? configureConnectionBannerTitle : inputError;

  const isTaskExecuting = taskExecutionState !== TASK_EXECUTION_STATE.IDLE;

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
    } else if (isConnectionConfigured) {

      // proceed with task execution
      handleExecuteTask();
    }
  };


  return (
    <PluginContext.Provider value={ pluginsProviderValue }>
      <div className="task-testing__container">
        <div className={ `task-testing__container--header ${getHeaderStateClass({ isTaskExecuting, isConnectionConfigured, inputError, output })}` }>
          <div className="task-testing__header-actions">
            { showTooltip ? (
              <Tooltip
                label={ tooltipLabel }
                align="bottom-start"
              >
                <Button
                  data-testid="test-task-btn"
                  className="btn-execute"
                  kind="secondary"
                  size="sm"
                  renderIcon={ isTaskExecuting ? StopFilledAlt : PlayFilledAlt }
                  iconDescription={ isTaskExecuting ? 'Stop test' : 'Run test' }
                  onClick={ handleTestTask }
                  disabled={ !testTaskButtonEnabled }>
                  {isTaskExecuting ? 'Stop test' : 'Run test'}
                </Button>
              </Tooltip>
            ) : (
              <Button
                data-testid="test-task-btn"
                className="btn-execute"
                kind={ isTaskExecuting ? 'secondary' : 'primary' }
                size="sm"
                renderIcon={ isTaskExecuting ? StopFilledAlt : PlayFilledAlt }
                iconDescription={ isTaskExecuting ? 'Stop test' : 'Run test' }
                onClick={ handleTestTask }
                disabled={ !testTaskButtonEnabled }>
                {isTaskExecuting ? 'Stop test' : 'Run test'}
              </Button>
            ) }
          </div>
          <div className="task-testing__header-status">
            <HeaderStatusIcon
              isTaskExecuting={ isTaskExecuting }
              isConnectionConfigured={ isConnectionConfigured }
              inputError={ inputError }
              output={ output }
            />
            <span className="task-testing__header-status-text">
              <HeaderStatusText
                configureConnectionBannerTitle={ configureConnectionBannerTitle }
                isConnectionConfigured={ isConnectionConfigured }
                inputError={ inputError }
                output={ output }
              />
            </span>
          </div>
          <div className="task-testing__header-actions-right">
            <Tooltip label="Clear result" align="bottom-end">
              <Button
                kind="ghost"
                size="sm"
                hasIconOnly
                renderIcon={ Erase }
                iconDescription="Clear result"
                onClick={ handleResetOutput }
                disabled={ !output || isTaskExecuting }
              />
            </Tooltip>
            {
              onConfigureConnection && <Tooltip label={ configureConnectionLabel } align="bottom-end">
                <Button
                  data-testid="configure-connection-btn"
                  kind="ghost"
                  size="sm"
                  hasIconOnly
                  renderIcon={ Settings }
                  iconDescription={ configureConnectionLabel }
                  onClick={ () => onConfigureConnection() }
                  disabled={ isTaskExecuting }
                />
              </Tooltip>
            }
          </div>
        </div>
        <div className={ `task-testing__container--body${isTaskExecuting ? ' task-testing__container--body-executing' : ''}` }>
          <Tabs
            selectedIndex={ selectedTabIndex }
            setSelectedIndex={ setSelectedTabIndex }
            tabs={ [
              {
                label: 'Input',
                disabled: isTaskExecuting,
                children: (
                  <Input
                    allOutputs={ allOutputs }
                    input={ input }
                    onErrorChange={ setInputError }
                    onResetInput={ handleResetInput }
                    onSetInput={ handleSetInput }
                    variablesForElement={ variablesForElement }
                  />
                )
              },
              {
                label: 'Result',
                children: (
                  <Output
                    element={ element }
                    isConnectionConfigured={ isConnectionConfigured }
                    isTaskExecuting={ isTaskExecuting }
                    currentVariables={ currentVariables }
                    output={ output }
                    currentOperateUrl={ currentOperateUrl }
                    onResetOutput={ handleResetOutput }
                    taskExecutionState={ taskExecutionState }
                    executionLog={ isTaskExecuting ? executionLog : (output?.executionLog || []) }
                    tasklistBaseUrl={ tasklistBaseUrl }
                  />
                )
              },
              ...pluginsProviderValue.getPlugins('output.body.tab')
                .map(plugin => ({
                  label: plugin.label,
                  disabled: isTaskExecuting,
                  children: plugin.render?.({ element, output, isTaskExecuting, executionLog }) || plugin.children
                }))
                .filter(tab => tab.children)
            ] }
          />
        </div>
      </div>
      {children}
    </PluginContext.Provider>
  );
}


TaskTesting.Tab = PluginTab;
TaskTesting.Link = HeaderLink;


function getHeaderStateClass({ isTaskExecuting, isConnectionConfigured, inputError, output }) {
  if (isTaskExecuting) {
    return 'task-testing__container--header-executing';
  } else if (output?.error || output?.incident || !isConnectionConfigured || !!inputError) {
    return 'task-testing__container--header-error';
  } else if (output?.success) {
    return 'task-testing__container--header-success';
  } else if (output?.terminated) {
    return 'task-testing__container--header-terminated';
  } else if (output?.canceled) {
    return 'task-testing__container--header-canceled';
  }
  return '';
}

function HeaderStatusIcon({ isTaskExecuting, isConnectionConfigured, inputError, output }) {
  if (output?.error || output?.incident || !isConnectionConfigured || inputError) {
    return <Warning size={ 16 } className="task-testing__status-icon--error" />;
  }

  if (output?.success) {
    return <CheckmarkOutline size={ 16 } className="task-testing__status-icon--success" />;
  }

  if (output?.terminated) {
    return <StopFilledAlt size={ 16 } className="task-testing__status-icon--terminated" />;
  }

  if (output?.canceled) {
    return <ErrorFilled size={ 16 } className="task-testing__status-icon--canceled" />;
  }

  return null;
}

function HeaderStatusText({ isConnectionConfigured, configureConnectionBannerTitle, inputError, output }) {
  if (!isConnectionConfigured) {
    return configureConnectionBannerTitle;
  }

  if (inputError) {
    return 'Input error';
  }

  if (output) {
    if (output.error) {
      return 'Error';
    }

    if (output.incident) {
      return 'Incident';
    }

    if (output.success) {
      return 'Completed';
    }

    if (output.terminated) {
      return 'Terminated';
    }

    if (output.canceled) {
      return 'Canceled';
    }
  }

  return null;
}

/**
 * Simple Tabs component to switch between views.
 *
 * @param {Object} props
 * @param {number} [props.selectedIndex=0] - The index of the selected tab.
 * @param {function} [props.setSelectedIndex] - Function to set the index of the selected tab.
 * @param {{ label: string, children?: React.ReactNode, disabled?: boolean }[]} props.tabs - The tab definitions.
 * @returns {React.ReactElement} The rendered Tabs component.
 */
function Tabs({ selectedIndex = 0, setSelectedIndex = () => {}, tabs }) {
  return (
    <>
      <div className="task-testing-tabs__list" role="tablist">
        { tabs.map((tab, index) => (
          <button
            key={ index }
            type="button"
            role="tab"
            className={ classNames('task-testing-tabs__tab', {
              'task-testing-tabs__tab--active': index === selectedIndex,
              'task-testing-tabs__tab--disabled': tab.disabled
            }) }
            aria-selected={ index === selectedIndex }
            onClick={ () => setSelectedIndex(index) }
            disabled={ tab.disabled }
          >
            { tab.label }
          </button>
        )) }
      </div>
      <div className="task-testing-tabs__panel">
        { tabs[selectedIndex]?.children }
      </div>
    </>
  );
}