import React, { useCallback, useEffect, useState, useRef } from 'react';

import { Button, InlineLoading, Tooltip } from '@carbon/react';

import {
  Chemistry,
  Cursor_1 as Cursor,
  PlayFilledAlt,
  StopFilledAlt
} from '@carbon/icons-react';

import classNames from 'classnames';

import { useSelectedElement } from '../../hooks/useSelectedElement';

import { ElementConfig } from '../../ElementConfig';
import { ElementVariables } from '../../ElementVariables';

import Input from '../Input/Input';
import Output from '../Output/Output';

import TaskExecution from '../../TaskExecution';

import { getName } from '../../utils/element';

import '../../style/style.scss';

export const NO_ELEMENT_TEXT = 'Select a task to start testing';

/**
 * @param {Object} props
 * @param {Object} props.injector
 * @param {import('../../types').TaskExecutionApi} props.api
 * @param {boolean} props.isConnectionConfigured
 * @param {string} [props.configureConnectionBannerTitle]
 * @param {string} [props.configureConnectionBannerDescription]
 * @param {string} [props.configureConnectionLabel]
 * @param {Function} [props.onConfigureConnection]
 * @param {import('../../types').Config|undefined} [props.config]
 * @param {Function} [props.onConfigChanged=() => {}]
 * @param {string} [props.operateBaseUrl]
 * @param {Function} [props.onTaskExecution=() => {}]
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
  onTaskExecution = () => {},
  onTaskExecutionInterrupted = () => {}
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

  const element = useSelectedElement(injector);


  /**
   * @type {React.RefObject<TaskExecution?>}
   */
  const taskExecutionRef = useRef(null);

  // Initialize services once the injector is available
  useEffect(() => {
    const elementVariables = new ElementVariables(injector);
    elementVariablesRef.current = elementVariables;

    const elementConfig = new ElementConfig(injector, elementVariables, config);
    elementConfigRef.current = elementConfig;

    const taskExecution = new TaskExecution(injector, api);
    taskExecutionRef.current = taskExecution;
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

      elementConfigRef.current.getInputConfigForElement(element).then(setInput);
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

    /** @param {import('../../types').TaskExecutionError} error */
    const handleError = (error) => {
      elementConfigRef?.current?.setOutputConfigForElement(element, {
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

      if (processInstanceKey) {
        const operateUrl = operateBaseUrl ? `${operateBaseUrl}/processes/${processInstanceKey}` : null;
        elementConfigRef?.current?.setOutputConfigForElement(element, {
          operateUrl
        });
      }
    };

    /** @param {import('../../types').ElementOutput} output */
    const handleFinished = (output) => {
      const { operateUrl } = elementConfigRef?.current?.getOutputConfigForElement(element) || {};
      elementConfigRef?.current?.setOutputConfigForElement(element, {
        ...output,
        operateUrl
      });
    };

    taskExecutionRef?.current?.on('taskExecution.finished', handleFinished);
    taskExecutionRef?.current?.on('taskExecution.status.changed', handleStatusChange);
    taskExecutionRef?.current?.on('taskExecution.error', handleError);
    taskExecutionRef?.current?.on('taskExecution.interrupted', () => onTaskExecutionInterrupted());

    return () => {
      if (taskExecutionRef.current) {
        taskExecutionRef.current.off('taskExecution.finished', handleFinished);
        taskExecutionRef.current.off('taskExecution.status.changed', handleStatusChange);
        taskExecutionRef.current.off('taskExecution.error', handleError);
        taskExecutionRef.current.off('taskExecution.interrupted', () => onTaskExecutionInterrupted());
      }
    };
  }, [ element ]);

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

    elementConfigRef?.current?.getInputConfigForElement(element).then(setInput);
    setOutput(elementConfigRef?.current?.getOutputConfigForElement(element));
  }, [ element ]);

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
    if (!isConnectionConfigured
      || inputError
      || !element
      || !taskExecutionRef.current
      || !elementConfigRef.current) {
      return;
    }

    const inputConfig = await elementConfigRef.current.getInputConfigForElement(element);

    elementConfigRef.current.setOutputConfigForElement(element, null);

    taskExecutionRef.current.executeTask(element.id, JSON.parse(inputConfig));

    onTaskExecution();
  };

  const handleCancelTaskExecution = () => {
    if (taskExecutionRef.current) {
      taskExecutionRef.current.cancelTaskExecution();
    }
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
          <Cursor /> <span>{ NO_ELEMENT_TEXT }</span>
        </div>
      </div>
    );
  }

  const showTooltip = !isConnectionConfigured || !!inputError;
  const tooltipLabel = !isConnectionConfigured ? 'Connection not configured' : inputError;
  const isTaskExecuting = !!taskExecutionStatus && taskExecutionStatus !== 'idle';

  return (
    <div className="task-testing__container">
      <div className="task-testing__container--left">
        <div className="task-testing__container--header">
          <div className="task-name">
            <Chemistry />
            <span>{getName(element)}</span>
          </div>
          <Tooltip
            className={ classNames({ 'has-error': showTooltip }) }
            label={ tooltipLabel }
            align="left-start"
          >
            <Button
              className="btn-execute"
              kind="primary"
              size="sm"
              renderIcon={ isTaskExecuting ? StopFilledAlt : PlayFilledAlt }
              onClick={ isTaskExecuting ? handleCancelTaskExecution : handleExecuteTask }
            >
              {isTaskExecuting ? 'Cancel' : 'Test task'}
            </Button>
          </Tooltip>
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
          isConnectionConfigured={ isConnectionConfigured }
          configureConnectionBannerTitle={ configureConnectionBannerTitle }
          configureConnectionBannerDescription={ configureConnectionBannerDescription }
          configureConnectionLabel={ configureConnectionLabel }
          onConfigureConnection={ onConfigureConnection }
          isTaskExecuting={ isTaskExecuting }
          output={ output }
          onResetOutput={ handleResetOutput }
          taskExecutionStatus={ taskExecutionStatus || 'idle' }
        />
      </div>
    </div>
  );
}
