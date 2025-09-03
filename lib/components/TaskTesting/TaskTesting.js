import React, { useCallback, useEffect, useState, useRef } from 'react';

import { Button, InlineLoading, Tooltip } from '@carbon/react';

import { Chemistry, Cursor_1 as Cursor } from '@carbon/icons-react';

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
 * @param {boolean} [props.canExecuteTask]
 * @param {string} [props.cannotExecuteTaskTitle]
 * @param {string} [props.cannotExecuteTaskMessage]
 * @param {import('react').MouseEventHandler} [props.cannotExecuteTaskCallback=() => {}]
 * @param {import('../../types').Config|undefined} [props.config]
 * @param {Function} [props.onConfigChanged=() => {}]
 */
export default function TaskTesting({
  injector,
  api,
  canExecuteTask,
  cannotExecuteTaskTitle = 'Cannot test task',
  cannotExecuteTaskMessage = 'Configure your connection to test the task',
  cannotExecuteTaskCallback = () => {},
  config,
  onConfigChanged: _onConfigChanged = () => {}
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

  const [ input, setInput ] = useState('{}');
  const [ output, setOutput ] = useState(null);
  const [ allOutputs, setAllOutputs ] = useState({});
  const [ inputError, setInputError ] = useState(null);

  const element = useSelectedElement(injector);


  /**
   * @type {React.RefObject<TaskExecution?>}
   */
  const taskExecutionRef = useRef(null);

  useEffect(() => {
    const elementVariables = new ElementVariables(injector);
    elementVariablesRef.current = elementVariables;

    const elementConfig = new ElementConfig(injector, elementVariables, config);
    elementConfigRef.current = elementConfig;

    const taskExecution = new TaskExecution(injector, api);
    taskExecutionRef.current = taskExecution;
  }, []);

  useEffect(() => {
    if (!element || !elementVariablesRef.current) {
      return;
    }

    elementVariablesRef.current.getVariablesForElement(element).then(variables => setVariablesForElement(variables));
  }, [ element ]);

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

  useEffect(() => {
    if (!elementConfigRef.current) {
      return;
    }

    const handleConfigChanged = () => {
      if (!elementConfigRef.current) {
        return;
      }

      _onConfigChanged(elementConfigRef.current.getConfig());

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
  }, [ element, _onConfigChanged, setAllOutputs, setInput, setOutput ]);

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

    const handleTaskExecutionError = ({ message, error }) => {
      setIsTaskExecuting(false);

      if (!element || !elementConfigRef.current) {
        return;
      }

      elementConfigRef.current.setOutputConfigForElement(element, {
        success: false,
        error: {
          message,
          error
        }
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

    return () => {
      if (taskExecutionRef.current) {
        taskExecutionRef.current.off('taskExecution.start', handleTaskExecutionStart);
        taskExecutionRef.current.off('taskExecution.error', handleTaskExecutionError);
        taskExecutionRef.current.off('taskExecution.cancelled', handleTaskExecutionCancelled);
        taskExecutionRef.current.off('taskExecution.end', handleTaskExecutionEnd);
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
    if (!canExecuteTask || !element || !taskExecutionRef.current || !elementConfigRef.current) {
      return;
    }

    const inputConfig = await elementConfigRef.current.getInputConfigForElement(element);

    let parsedInput;

    try {
      parsedInput = JSON.parse(inputConfig);
    } catch (err) {
      return;
    }

    taskExecutionRef.current.executeTask(element.id, parsedInput);
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

  return (
    <div className="task-testing__container">
      <div className="task-testing__container--header">
        <div className="task-testing__container--header--left">
          <Chemistry />
          <div>Test task <span className="task-testing__container--header-task-name">{ getName(element) }</span></div>
        </div>
        <div className="task-testing__container--header--right">
          <Tooltip className={ (!canExecuteTask || inputError) ? 'has-error' : '' } label="Cannot test task" align="left-start">
            <Button
              kind={ canExecuteTask && !inputError && !isTaskExecuting ? 'primary' : 'tertiary' }
              size="sm"
              onClick={ isTaskExecuting ? handleCancelTaskExecution : handleExecuteTask }>
              { isTaskExecuting && <InlineLoading status="active" /> }
              {
                isTaskExecuting ? 'Testing...' : 'Test task'
              }
            </Button>
          </Tooltip>
        </div>
      </div>
      <div className="task-testing__container--main">
        <div className="task-testing__container--main--left">
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
        <div className="task-testing__container--main--right">
          <Output
            canExecuteTask={ canExecuteTask }
            cannotExecuteTaskTitle={ cannotExecuteTaskTitle }
            cannotExecuteTaskMessage={ cannotExecuteTaskMessage }
            cannotExecuteTaskCallback={ cannotExecuteTaskCallback }
            isTaskExecuting={ isTaskExecuting }
            output={ output }
            onResetOutput={ handleResetOutput }
          />
        </div>
      </div>
    </div>
  );
}
