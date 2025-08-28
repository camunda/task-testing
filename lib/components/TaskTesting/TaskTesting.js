import React, { useCallback, useEffect, useState } from 'react';

import { Button, InlineLoading, Tooltip } from '@carbon/react';

import { Chemistry, Cursor_1 as Cursor, Play, Stop, Warning } from '@carbon/icons-react';

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
 * @param {string} [props.cannotExecuteTaskLabel='Cannot test task']
 * @param {string} [props.cannotExecuteTaskDescription='Configure your connection to test the task']
 * @param {Function} [props.cannotExecuteTaskCallback=() => {}]
 * @param {import('../../types').Config|undefined} [props.config]
 * @param {Function} [props.onConfigChanged=() => {}]
 *
 * @returns {import('react').ReactElement}
 */
export default function TaskTesting({
  injector,
  api,
  canExecuteTask,
  cannotExecuteTaskLabel = 'Cannot test task',
  cannotExecuteTaskDescription = 'Configure your connection to test the task',
  cannotExecuteTaskCallback = () => {},
  config,
  onConfigChanged: _onConfigChanged = () => {}
}) {
  const [ isTaskExecuting, setIsTaskExecuting ] = useState(false);
  const [ taskExecutionStateDescription, setTaskExecutionStateDescription ] = useState('');

  const element = useSelectedElement(injector);

  const [ elementVariables, setElementVariables ] = useState(null);

  const [ variablesForElement, setVariablesForElement ] = useState([]);

  const [ elementConfig, setElementConfig ] = useState(null);

  const [ input, setInput ] = useState('{}');
  const [ output, setOutput ] = useState(null);
  const [ allOutputs, setAllOutputs ] = useState({});

  const [ inputError, setInputError ] = useState(null);

  const [ taskExecution, setTaskExecution ] = useState(null);

  useEffect(() => {
    const elementVariables = new ElementVariables(injector);

    const elementConfig = new ElementConfig(injector, elementVariables, config);

    const taskExecution = new TaskExecution(injector, api);

    setElementVariables(elementVariables);

    setElementConfig(elementConfig);

    setTaskExecution(taskExecution);
  }, []);

  useEffect(() => {
    if (!element || !elementVariables) {
      return;
    }

    elementVariables.getVariablesForElement(element).then(variables => setVariablesForElement(variables));
  }, [ element, elementVariables ]);

  useEffect(() => {
    if (!elementVariables) {
      return;
    }

    const onVariablesChanged = async () => {
      if (!element) {
        return;
      }

      const variables = await elementVariables.getVariablesForElement(element);

      setVariablesForElement(variables);
    };

    elementVariables.on('variables.changed', onVariablesChanged);

    return () => {
      elementVariables.off('variables.changed', onVariablesChanged);
    };
  }, [ element, elementVariables ]);

  useEffect(() => {
    if (!elementConfig) {
      return;
    }

    const onConfigChanged = () => {
      _onConfigChanged(elementConfig.getConfig());

      if (!element) {
        return;
      }

      elementConfig.getInputConfigForElement(element).then(setInput);
      setOutput(elementConfig.getOutputConfigForElement(element));
      setAllOutputs(elementConfig.getConfig().output);
    };

    elementConfig.on('config.changed', onConfigChanged);

    return () => {
      elementConfig.off('config.changed', onConfigChanged);
    };
  }, [ element, elementConfig, _onConfigChanged, setAllOutputs, setInput, setOutput ]);

  useEffect(() => {
    if (!taskExecution) {
      return;
    }

    const onTaskExecutionStart = () => {
      setIsTaskExecuting(true);

      if (!element || !elementConfig) {
        return;
      }

      elementConfig.setOutputConfigForElement(element, null);
    };

    taskExecution.on('taskExecution.start', onTaskExecutionStart);

    const onTaskExecutionProgress = ({ description }) => {
      setTaskExecutionStateDescription(description);
    };

    taskExecution.on('taskExecution.progress', onTaskExecutionProgress);

    const onTaskExecutionError = ({ message, response }) => {
      setIsTaskExecuting(false);

      if (!element || !elementConfig) {
        return;
      }

      elementConfig.setOutputConfigForElement(element, {
        success: false,
        error: {
          message,
          response
        }
      });
    };

    taskExecution.on('taskExecution.error', onTaskExecutionError);

    const onTaskExecutionCancelled = () => {
      setIsTaskExecuting(false);
    };

    taskExecution.on('taskExecution.cancelled', onTaskExecutionCancelled);

    const onTaskExecutionEnd = ({
      incident,
      success,
      variables
    }) => {
      setIsTaskExecuting(false);

      if (!element || !elementConfig) {
        return;
      }

      elementConfig.setOutputConfigForElement(element, {
        success,
        incident,
        variables
      });
    };

    taskExecution.on('taskExecution.end', onTaskExecutionEnd);

    return () => {
      taskExecution.off('taskExecution.start', onTaskExecutionStart);
      taskExecution.off('taskExecution.progress', onTaskExecutionProgress);
      taskExecution.off('taskExecution.error', onTaskExecutionError);
      taskExecution.off('taskExecution.cancelled', onTaskExecutionCancelled);
      taskExecution.off('taskExecution.end', onTaskExecutionEnd);
    };
  }, [ element, elementConfig, taskExecution ]);

  useEffect(() => {
    if (config && elementConfig) {
      if (JSON.stringify(config) !== JSON.stringify(elementConfig.getConfig())) {
        elementConfig.setConfig(config);
      }
    }
  }, [ config, elementConfig ]);

  useEffect(() => {
    if (element && elementConfig) {
      elementConfig.getInputConfigForElement(element).then(setInput);
      setOutput(elementConfig.getOutputConfigForElement(element));
    }
  }, [ element, elementConfig ]);

  const onSetInput = useCallback((newInput) => {
    if (element && elementConfig) {
      elementConfig.setInputConfigForElement(element, newInput);
    }
  }, [ element, elementConfig ]);

  const onResetInput = useCallback(() => {
    if (element && elementConfig) {
      elementConfig.resetInputConfigForElement(element);
    }
  }, [ element, elementConfig ]);

  const onExecuteTask = async () => {
    if (!element || !taskExecution) {
      return;
    }

    const inputConfig = await elementConfig.getInputConfigForElement(element);

    taskExecution.executeTask(element.id, JSON.parse(inputConfig));
  };

  const onCancelTaskExecution = () => {
    if (taskExecution) {
      taskExecution.cancelTaskExecution();
    }
  };

  const onResetOutput = useCallback(() => {
    if (element && elementConfig) {
      elementConfig.resetOutputConfigForElement(element);
    }
  }, [ element, elementConfig ]);

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
          {
            !canExecuteTask && <Tooltip label={ cannotExecuteTaskDescription } align="left-start">
              <Button kind="tertiary" onClick={ cannotExecuteTaskCallback } renderIcon={ Warning } size="sm">{ cannotExecuteTaskLabel }</Button>
            </Tooltip>
          }
          {
            canExecuteTask && !isTaskExecuting && <Button kind="primary" onClick={ onExecuteTask } renderIcon={ Play } size="sm">
              Test task
            </Button>
          }
          {
            canExecuteTask && isTaskExecuting && <Button kind="tertiary" onClick={ onCancelTaskExecution } renderIcon={ Stop } size="sm">
              Cancel
            </Button>
          }
        </div>
      </div>
      <div className="task-testing__container--main">
        <div className="task-testing__container--main--left">
          <Input
            allOutputs={ allOutputs }
            element={ element }
            input={ input }
            onErrorChange={ setInputError }
            output={ output }
            resetInput={ onResetInput }
            setInput={ onSetInput }
            variablesForElement={ variablesForElement }
          />
        </div>
        <div className="task-testing__container--main--right">
          <Output
            inputError={ inputError }
            isTaskExecuting={ isTaskExecuting }
            onCancelTaskExecution={ onCancelTaskExecution }
            onExecuteTask={ onExecuteTask }
            output={ output }
            resetOutput={ onResetOutput }
            taskExecutionStateDescription={ taskExecutionStateDescription }
          />
        </div>
      </div>
    </div>
  );
}
