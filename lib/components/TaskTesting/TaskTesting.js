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
 * @param {Function} [props.onConfigureConnection]
 * @param {import('../../types').Config|undefined} [props.config]
 * @param {Function} [props.onConfigChanged=() => {}]
 */
export default function TaskTesting({
  injector,
  api,
  isConnectionConfigured,
  onConfigureConnection,
  config,
  onConfigChanged = () => {}
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

  const [ isTaskExecuting, setIsTaskExecuting ] = useState(false);

  /**
   * @type {ReturnType<typeof useState<import('../../types').TaskExecutionStatus>>}
   */
  const [ taskExecutionStatus, setTaskExecutionStatus ] = useState();

  const [ input, setInput ] = useState('{}');

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
    if (!taskExecutionRef.current) {
      return;
    }

    const handleTaskExecutionStart = () => {
      setIsTaskExecuting(true);

      if (!element || !elementConfigRef.current) {
        return;
      }

      elementConfigRef.current.setOutputConfigForElement(element, null);
    };

    taskExecutionRef.current.on('taskExecution.start', handleTaskExecutionStart);

    /** @param {import('../../types').TaskExecutionEvents.Error} error */
    const handleTaskExecutionError = (error) => {
      setIsTaskExecuting(false);

      if (!element || !elementConfigRef.current) {
        return;
      }

      elementConfigRef.current.setOutputConfigForElement(element, {
        success: false,
        error
      });
    };

    taskExecutionRef.current.on('taskExecution.error', handleTaskExecutionError);

    const handleTaskExecutionCancelled = () => {
      setIsTaskExecuting(false);
    };

    taskExecutionRef.current.on('taskExecution.cancelled', handleTaskExecutionCancelled);

    const handleTaskExecutionEnd = ({
      incident,
      success,
      variables
    }) => {
      setIsTaskExecuting(false);

      if (!element || !elementConfigRef.current) {
        return;
      }

      elementConfigRef.current.setOutputConfigForElement(element, {
        success,
        incident,
        variables
      });
    };

    taskExecutionRef.current.on('taskExecution.end', handleTaskExecutionEnd);

    taskExecutionRef.current.on('taskExecution.statusChanged', setTaskExecutionStatus);

    return () => {
      if (taskExecutionRef.current) {
        taskExecutionRef.current.off('taskExecution.start', handleTaskExecutionStart);
        taskExecutionRef.current.off('taskExecution.error', handleTaskExecutionError);
        taskExecutionRef.current.off('taskExecution.cancelled', handleTaskExecutionCancelled);
        taskExecutionRef.current.off('taskExecution.end', handleTaskExecutionEnd);
        taskExecutionRef.current.off('taskExecution.statusChanged', setTaskExecutionStatus);
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
    if (element && elementConfigRef.current) {
      elementConfigRef.current.getInputConfigForElement(element).then(setInput);
      setOutput(elementConfigRef.current.getOutputConfigForElement(element));
    }
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

    taskExecutionRef.current.executeTask(element.id, JSON.parse(inputConfig));
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
          element={ element }
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
          onConfigureConnection={ onConfigureConnection }
          isTaskExecuting={ isTaskExecuting }
          output={ output }
          onResetOutput={ handleResetOutput }
          taskExecutionStatus={ taskExecutionStatus }
        />
      </div>
    </div>
  );
}
