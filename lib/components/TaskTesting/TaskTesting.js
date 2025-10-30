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
  StopFilledAlt
} from '@carbon/icons-react';

import classNames from 'classnames';

import { useSelectedElement } from '../../hooks/useSelectedElement';
import { useElementVariables } from '../../hooks/useElementVariables';

import { ElementConfig } from '../../ElementConfig';

import Input from '../Input/Input';
import Output from '../Output/Output';

import TaskExecution from '../../TaskExecution';

import { getName, getType } from '../../utils/element';
import { getOperateUrl } from '../../utils/getOperateUrl';

import '../../style/style.scss';

/**
 * @import {
 *   ReactHook,
 *   ElementOutput,
 *   TaskExecutionApi,
 *   TaskExecutionStatus,
 * } from '../../types';
 */

/**
 * @param {Object} props
 * @param {Object} props.injector
 * @param {TaskExecutionApi} props.api
 * @param {boolean} props.isConnectionConfigured
 * @param {string} [props.configureConnectionBannerTitle]
 * @param {string} [props.configureConnectionBannerDescription]
 * @param {string} [props.configureConnectionLabel]
 * @param {Function} [props.onConfigureConnection]
 * @param {import('../../types').Config} [props.config]
 * @param {Function} [props.onConfigChanged=() => {}]
 * @param {string} [props.operateBaseUrl]
 * @param {string} [props.documentationUrl]
 * @param {Function} [props.onTaskExecutionStarted=() => {}]
 * @param {Function} [props.onTaskExecutionFinished=() => {}]
 * @param {Function} [props.onTaskExecutionInterrupted=() => {}]
 */
export default function TaskTesting({
  injector,
  api,
  isConnectionConfigured,
  configureConnectionBannerTitle = 'Connection required',
  configureConnectionBannerDescription = 'Configure a connection to start testing.',
  configureConnectionLabel = 'Configure',
  onConfigureConnection,
  config,
  onConfigChanged = () => {},
  operateBaseUrl,
  documentationUrl,
  onTaskExecutionStarted = () => {},
  onTaskExecutionFinished = () => {},
  onTaskExecutionInterrupted = () => {}
}) {

  /**
   * @type {React.RefObject<ElementConfig>}
   */
  const { current: elementConfig } = useRef(new ElementConfig(config));

  /**
   * @type {React.RefObject<TaskExecution?>}
   */
  const taskExecutionRef = useRef(null);

  /**
   * @type {ReactHook<TaskExecutionStatus>}
   */
  const [ taskExecutionStatus, setTaskExecutionStatus ] = useState();

  /**
   * Raw text content of the input editor.
   * @type {ReactHook<string>}
   */
  const [ inputText, setInputText ] = useState();

  /** @type {ReactHook<string>} */
  const [ inputError, setInputError ] = useState();

  /** @type {ReactHook<ElementOutput>} */
  const [ output, setOutput ] = useState();

  /**
   * Operate URL used only during task execution, later saved in the output.
   * @type {ReactHook<string>}
   */
  const [ currentOperateUrl, setCurrentOperateUrl ] = useState();

  const [ element, selectedElementMessage ] = useSelectedElement(injector);

  const variables = useElementVariables(injector, element, elementConfig);

  console.log('variables in TaskTesting', variables);

  // Initialize services once the injector is available
  useEffect(() => {
    const taskExecution = new TaskExecution(injector, api);
    taskExecutionRef.current = taskExecution;

    return () => {
      taskExecutionRef.current?.cancelTaskExecution();
    };
  }, [ injector ]);

  // Listen to `config.changed` event
  useEffect(() => {
    const handleConfigChanged = () => {
      onConfigChanged(elementConfig.getConfig());

      if (!element) {
        return;
      }

      setInputText(elementConfig.getInputConfigForElement(element));
      setOutput(elementConfig.getOutputConfigForElement(element));
    };

    elementConfig.on('config.changed', handleConfigChanged);

    return () => {
      if (elementConfig) {
        elementConfig.off('config.changed', handleConfigChanged);
      }
    };
  }, [ element, onConfigChanged, setInputText, setOutput ]);

  // Subscribe to task execution events
  useEffect(() => {

    /** @param {import('../../types').TaskExecutionError} error */
    const handleError = (error) => {
      elementConfig.setOutputConfigForElement(element, {
        success: false,
        error
      });
    };

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

    /** @param {import('../../types').ElementOutput} output */
    const handleFinished = (output) => {
      elementConfig.setOutputConfigForElement(element, {
        ...output,
        operateUrl: currentOperateUrl
      });
      onTaskExecutionFinished(element, output);
    };

    const handleInterrupted = () => {
      onTaskExecutionInterrupted();
    };

    taskExecutionRef?.current?.on('taskExecution.finished', handleFinished);
    taskExecutionRef?.current?.on('taskExecution.status.changed', handleStatusChange);
    taskExecutionRef?.current?.on('taskExecution.error', handleError);
    taskExecutionRef?.current?.on('taskExecution.interrupted', handleInterrupted);

    return () => {
      if (taskExecutionRef.current) {
        taskExecutionRef.current.off('taskExecution.finished', handleFinished);
        taskExecutionRef.current.off('taskExecution.status.changed', handleStatusChange);
        taskExecutionRef.current.off('taskExecution.error', handleError);
        taskExecutionRef.current.off('taskExecution.interrupted', handleInterrupted);
      }
    };
  }, [ element, operateBaseUrl, currentOperateUrl ]);

  useEffect(() => {
    if (config && elementConfig) {
      if (JSON.stringify(config) !== JSON.stringify(elementConfig.getConfig())) {
        elementConfig.setConfig(config);
      }
    }
  }, [ config ]);

  useEffect(() => {
    if (!element) {
      setInputText(undefined);

      return;
    }

    setInputText(elementConfig.getInputConfigForElement(element));
    setOutput(elementConfig.getOutputConfigForElement(element));
  }, [ element ]);

  const handleSetInput = useCallback((newInput) => {
    if (element && elementConfig) {
      elementConfig.setInputConfigForElement(element, newInput);
    }
  }, [ element ]);

  const handleResetInput = useCallback(() => {
    if (element && elementConfig) {
      elementConfig.resetInputConfigForElement(element);
    }
  }, [ element ]);

  const handleExecuteTask = async () => {
    if (!isConnectionConfigured
      || inputError
      || !element
      || !taskExecutionRef.current
      || !elementConfig) {
      return;
    }

    onTaskExecutionStarted(element);

    const inputConfig = elementConfig.getInputConfigForElement(element);

    elementConfig.setOutputConfigForElement(element, {});

    taskExecutionRef.current.executeTask(element, JSON.parse(inputConfig));
  };

  const handleCancelTaskExecution = () => {
    taskExecutionRef?.current?.cancelTaskExecution();
  };

  const handleResetOutput = useCallback(() => {
    if (element && elementConfig) {
      elementConfig.resetOutputConfigForElement(element);
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

  const handleClick = () => {
    if (!isConnectionConfigured) {
      if (onConfigureConnection) {
        onConfigureConnection();
      }

      return;
    }

    if (isTaskExecuting) {
      handleCancelTaskExecution();
      return;
    }

    handleExecuteTask();
  };

  return (
    <div className="task-testing__container">
      <div className="task-testing__container--left">
        <div className="task-testing__container--header">
          <div className="task-header">
            <span className="task-type">{getType(element, injector)}</span>
            <span className="task-name">{getName(element)}</span>
          </div>
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
              onClick={ handleClick }
            >
              {isTaskExecuting ? 'Cancel' : 'Test task'}
            </Button>
          </Tooltip>
        </div>
        <Input
          input={ inputText }
          onErrorChange={ setInputError }
          onResetInput={ handleResetInput }
          onSetInput={ handleSetInput }
          variables={ variables }
        />
      </div>
      <div className="task-testing__container--right">
        <Output
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
  );
}
