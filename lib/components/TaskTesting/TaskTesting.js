import React, { useCallback, useEffect, useState, useRef } from 'react';

import {
  Button,
  InlineLoading,
  Tooltip,
  Link
} from '@carbon/react';

import {
  Cursor_1 as Cursor,
  PlayFilledAlt,
  StopFilledAlt,
  Settings
} from '@carbon/icons-react';

import classNames from 'classnames';

import { useSelectedElement } from '../../hooks/useSelectedElement';

import { ElementConfig } from '../../ElementConfig';
import { ElementVariables } from '../../ElementVariables';

import Input from '../Input/Input';
import Output, { HeaderLink } from '../Output/Output';

import TaskExecution from '../../TaskExecution';

import { getName, getType } from '../../utils/element';
import { getOperateUrl } from '../../utils/getOperateUrl';

import '../../style/style.scss';
import { PluginContext, usePluginsProviderValue } from '../shared/plugins';
import { OutputTab } from '../Output/OutputVariables';

/**
 * @param {Object} props
 * @param {Object} props.injector
 * @param {import('../../types').TaskExecutionApi} props.api
 * @param {boolean} props.isConnectionConfigured
 * @param {string} [props.configureConnectionBannerTitle]
 * @param {string} [props.configureConnectionBannerDescription]
 * @param {string} [props.configureConnectionLabel]
 * @param {Function} [props.onConfigureConnection] - Callback invoked when
 * the user clicks on the _Configure connection_ button.
 * @param {(() => boolean | Promise<boolean>)} [props.onTestTask] - Callback invoked when the user clicks
 * on the _Test task_ button. Should return `true` to proceed with task
 * execution or `false` to abort it. Can return a promise resolving to a
 * boolean.
 * @param {import('../../types').Config|undefined} [props.config]
 * @param {Function} [props.onConfigChanged=() => {}]
 * @param {string} [props.operateBaseUrl]
 * @param {string} [props.documentationUrl]
 * @param {Function} [props.onTaskExecutionStarted=() => {}]
 * @param {Function} [props.onTaskExecutionFinished=() => {}] - Called with (element, result) where result contains success and optional reason for failures
 * @param {React.ReactNode[]} [props.children=[]]
 */
export default function TaskTesting({
  injector,
  api,
  isConnectionConfigured,
  configureConnectionBannerTitle = 'Connection required',
  configureConnectionBannerDescription = 'Configure a connection to start testing.',
  configureConnectionLabel = 'Configure',
  onConfigureConnection,
  onTestTask,
  config,
  onConfigChanged = () => {},
  operateBaseUrl,
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

  /**
   * @type {ReturnType<typeof useState<import('../../types').TaskExecutionStatus>>}
   */
  const [ taskExecutionStatus, setTaskExecutionStatus ] = useState();

  /**
   * @type {ReturnType<typeof useState<string>>}
   */
  const [ input, setInput ] = useState();

  /**
   * @type {ReturnType<typeof useState<import('../../types').ElementOutput>>}
   */
  const [ output, setOutput ] = useState();
  const [ allOutputs, setAllOutputs ] = useState({});
  const [ inputError, setInputError ] = useState(null);

  /**
   * Operate URL used only during task execution, later saved in the output.
   *
   * @type {ReturnType<typeof useState<string>>}
   */
  const [ currentOperateUrl, setCurrentOperateUrl ] = useState();

  const [ element, selectedElementMessage ] = useSelectedElement(injector);

  /**
   * @type {React.RefObject<TaskExecution?>}
   */
  const taskExecutionRef = useRef(null);

  const [ testTaskButtonEnabled, setTestTaskButtonEnabled ] = useState(true);

  // Initialize services once the injector is available
  useEffect(() => {
    const elementVariables = new ElementVariables(injector);
    elementVariablesRef.current = elementVariables;

    const elementConfig = new ElementConfig(injector, elementVariables, config);
    elementConfigRef.current = elementConfig;

    const taskExecution = new TaskExecution(injector, api);
    taskExecutionRef.current = taskExecution;

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
     * @param {import('../../types').TaskExecutionStatus} status
     * @param {string} [processInstanceKey]
     */
    const handleStatusChange = (status, processInstanceKey) => {
      setTaskExecutionStatus(status);

      if (processInstanceKey && operateBaseUrl) {
        const url = getOperateUrl(operateBaseUrl, processInstanceKey);
        setCurrentOperateUrl(url);
      }

      if (status === 'idle') {
        setCurrentOperateUrl(undefined);
      }
    };

    /** @param {import('../../types').TaskExecutionResult} result */
    const handleFinished = (result) => {

      // Only save to config if it's a successful execution, incident, or error (not user cancellations)
      if (result.success) {
        elementConfigRef?.current?.setOutputConfigForElement(element, {
          success: true,
          variables: result.variables,
          operateUrl: currentOperateUrl
        });
      } else if (result.reason === 'incident') {
        elementConfigRef?.current?.setOutputConfigForElement(element, {
          success: false,
          variables: result.variables,
          incident: result.incident,
          operateUrl: currentOperateUrl
        });
      } else if (result.reason === 'error') {
        elementConfigRef?.current?.setOutputConfigForElement(element, {
          success: false,
          error: result.error
        });
      }
      onTaskExecutionFinished(element, result);
    };

    taskExecutionRef?.current?.on('taskExecution.finished', handleFinished);
    taskExecutionRef?.current?.on('taskExecution.status.changed', handleStatusChange);

    return () => {
      if (taskExecutionRef.current) {
        taskExecutionRef.current.off('taskExecution.finished', handleFinished);
        taskExecutionRef.current.off('taskExecution.status.changed', handleStatusChange);
      }
    };
  }, [ element, operateBaseUrl, currentOperateUrl ]);

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

    setInput(elementConfigRef?.current?.getInputConfigForElement(element));
    setOutput(elementConfigRef?.current?.getOutputConfigForElement(element));
  }, [ element ]);

  const pluginsProviderValue = usePluginsProviderValue();

  const handleSetInput = useCallback((newInput) => {
    if (element && elementConfigRef.current) {
      elementConfigRef.current.setInputConfigForElement(element, newInput);
    }
  }, [ element ]);

  const handleResetInput = useCallback(() => {
    if (element && elementConfigRef.current) {
      elementConfigRef.current.resetInputConfigForElement(element);
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

    const inputConfig = elementConfigRef.current.getInputConfigForElement(element);

    elementConfigRef.current.setOutputConfigForElement(element, null);

    taskExecutionRef.current.executeTask(element, JSON.parse(inputConfig));
  };

  const handleCancelTaskExecution = () => {
    taskExecutionRef?.current?.cancelTaskExecution('user.cancel');
  };

  const handleResetOutput = useCallback(() => {
    if (element && elementConfigRef.current) {
      elementConfigRef.current.resetOutputConfigForElement(element);
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
          {documentationUrl && <Link href={ documentationUrl } target="_blank">Learn more.</Link>}
        </div>
      </div>
    );
  }

  const showTooltip = !isConnectionConfigured || !!inputError;
  const tooltipLabel = !isConnectionConfigured ? configureConnectionBannerTitle : inputError;
  const isTaskExecuting = !!taskExecutionStatus && taskExecutionStatus !== 'idle';

  /**
   * Handle clicking the _Test task_ button. If a task is currently executing,
   * it cancels the execution. If no task is executing, it either invokes the
   * `onTestTask` callback (if provided) or proceeds with task execution
   * directly (if the connection is configured). If the `onTestTask` callback
   * is provided, it is expected to return a boolean or a promise that resolves
   * to a boolean - `true` to proceed with task execution or `false` to abort it.
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
        <div className="task-testing__container--left">
          <div className="task-testing__container--header">
            <div className="task-header">
              <span className="task-type">{getType(element, injector)}</span>
              <span className="task-name">{getName(element)}</span>
            </div>
            <div>
              <Tooltip
                className={ classNames({ 'show-tooltip': showTooltip }) }
                label={ tooltipLabel }
                align="left-start"
              >
                <Button
                  data-testid="test-task-btn"
                  className="btn-execute"
                  kind="primary"
                  size="sm"
                  renderIcon={ isTaskExecuting ? StopFilledAlt : PlayFilledAlt }
                  iconDescription={ isTaskExecuting ? 'Cancel' : 'Test task' }
                  onClick={ handleTestTask }
                  disabled={ !testTaskButtonEnabled }>
                  {isTaskExecuting ? 'Cancel' : 'Test task'}
                </Button>
              </Tooltip>
              {
                onConfigureConnection && <Button
                  data-testid="configure-connection-btn"
                  kind="ghost"
                  size="sm"
                  hasIconOnly
                  renderIcon={ Settings }
                  iconDescription={ configureConnectionLabel }
                  onClick={ () => onConfigureConnection() }
                />
              }
            </div>
          </div>
          <Input
            allOutputs={ allOutputs }
            input={ input }
            onErrorChange={ setInputError }
            onResetInput={ handleResetInput }
            onSetInput={ handleSetInput }
            variablesForElement={ variablesForElement }
          />
        </div>
        <div className="task-testing__container--right">
          <Output
            element={ element }
            isConnectionConfigured={ isConnectionConfigured }
            configureConnectionBannerTitle={ configureConnectionBannerTitle }
            configureConnectionBannerDescription={ configureConnectionBannerDescription }
            configureConnectionLabel={ configureConnectionLabel }
            onConfigureConnection={ onConfigureConnection }
            isTaskExecuting={ isTaskExecuting }
            output={ output }
            currentOperateUrl={ currentOperateUrl }
            onResetOutput={ handleResetOutput }
            taskExecutionStatus={ taskExecutionStatus || 'idle' }
          />
        </div>
      </div>
      {children}
    </PluginContext.Provider>
  );
}


TaskTesting.Tab = OutputTab;
TaskTesting.Link = HeaderLink;