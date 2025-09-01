import React, { useCallback, useEffect, useState, useRef } from 'react';

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
 * @param {import('../../types').Config|undefined} [props.config]
 * @param {Function} [props.onConfigChanged=() => {}]
 */
export default function TaskTesting({
  injector,
  api,
  canExecuteTask,
  config,
  onConfigChanged = () => {},
  onMissingDeployConfig = () => {}
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
  const [ taskExecutionStateDescription, setTaskExecutionStateDescription ] = useState('');

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

    const onVariablesChanged = async () => {
      if (!element || !elementVariablesRef.current) {
        return;
      }

      const variables = await elementVariablesRef.current.getVariablesForElement(element);

      setVariablesForElement(variables);
    };

    elementVariablesRef.current.on('variables.changed', onVariablesChanged);

    return () => {
      if (elementVariablesRef.current) {
        elementVariablesRef.current.off('variables.changed', onVariablesChanged);
      }
    };
  }, [ element ]);

  useEffect(() => {
    if (!elementConfigRef.current) {
      return;
    }

    const handleConfigChange = () => {
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

    elementConfigRef.current.on('config.changed', handleConfigChange);

    return () => {
      if (elementConfigRef.current) {
        elementConfigRef.current.off('config.changed', handleConfigChange);
      }
    };
  }, [ element, onConfigChanged, setAllOutputs, setInput, setOutput ]);

  useEffect(() => {
    if (!taskExecutionRef.current) {
      return;
    }

    const onTaskExecutionStart = () => {
      setIsTaskExecuting(true);

      if (!element || !elementConfigRef.current) {
        return;
      }

      elementConfigRef.current.setOutputConfigForElement(element, null);
    };

    taskExecutionRef.current.on('taskExecution.start', onTaskExecutionStart);

    const onTaskExecutionProgress = ({ description }) => {
      setTaskExecutionStateDescription(description);
    };

    taskExecutionRef.current.on('taskExecution.progress', onTaskExecutionProgress);

    const onTaskExecutionError = ({ message, response }) => {
      setIsTaskExecuting(false);

      if (!element || !elementConfigRef.current) {
        return;
      }

      elementConfigRef.current.setOutputConfigForElement(element, {
        success: false,
        error: {
          message,
          response
        }
      });
    };

    taskExecutionRef.current.on('taskExecution.error', onTaskExecutionError);

    const onTaskExecutionCancelled = () => {
      setIsTaskExecuting(false);
    };

    taskExecutionRef.current.on('taskExecution.cancelled', onTaskExecutionCancelled);

    const onTaskExecutionEnd = ({
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

    taskExecutionRef.current.on('taskExecution.end', onTaskExecutionEnd);

    return () => {
      if (taskExecutionRef.current) {
        taskExecutionRef.current.off('taskExecution.start', onTaskExecutionStart);
        taskExecutionRef.current.off('taskExecution.progress', onTaskExecutionProgress);
        taskExecutionRef.current.off('taskExecution.error', onTaskExecutionError);
        taskExecutionRef.current.off('taskExecution.cancelled', onTaskExecutionCancelled);
        taskExecutionRef.current.off('taskExecution.end', onTaskExecutionEnd);
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

  const handleInputSet = (newInput) => {
    if (element && elementConfigRef.current) {
      elementConfigRef.current.setInputConfigForElement(element, newInput);
    }
  };

  const handleInputReset = () => {
    if (element && elementConfigRef.current) {
      elementConfigRef.current.resetInputConfigForElement(element);
    }
  };

  const handleTaskExecution = async () => {
    if (!element || !taskExecutionRef.current || !elementConfigRef.current) {
      return;
    }

    const inputConfig = await elementConfigRef.current.getInputConfigForElement(element);

    taskExecutionRef.current.executeTask(element.id, JSON.parse(inputConfig));
  };

  const handleTaskExecutionCancel = () => {
    if (taskExecutionRef.current) {
      taskExecutionRef.current.cancelTaskExecution();
    }
  };

  const handleOutputReset = () => {
    if (element && elementConfigRef.current) {
      elementConfigRef.current.resetOutputConfigForElement(element);
    }
  };

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
            resetInput={ handleInputReset }
            setInput={ handleInputSet }
            variablesForElement={ variablesForElement }
          />
        </div>
        <div className="task-testing__container--main--right">
          <Output
            inputError={ inputError }
            isTaskExecuting={ isTaskExecuting }
            onCancelTaskExecution={ handleTaskExecutionCancel }
            onExecuteTask={ handleTaskExecution }
            output={ output }
            resetOutput={ handleOutputReset }
            taskExecutionStateDescription={ taskExecutionStateDescription }
          />
        </div>
      </div>
    </div>
  );
}
