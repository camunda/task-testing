import React, { useState, useEffect } from 'react';

import { set, isEqual } from 'lodash';

import {
  useSelectedElement,
  useOutput,
  useInput,
  useVariableResolver
} from './hooks';

import Input from './components/Input/Input';
import Output from './components/Output/Output';

import run from './utils/run-task';

import './style/style.scss';

/**
 * @param {Object} props
 * @returns {import('react').ReactElement}
 */
export default function TaskTesting({
  injector,
  deploy,
  startInstance,
  getInstance,

  // Inputs and outputs saved per file,
  // provided by the modeler
  config = {},
  saveConfig
}) {

  const [ running, setRunning ] = useState(false);

  const element = useSelectedElement(injector);

  const { resolvedVariables, fetchingVariables } = useVariableResolver(injector, element);

  const { input, setInput, reset } = useInput(element, resolvedVariables, config.input);

  const { output, setOutput, outputVariables } = useOutput(element, config.output);

  useEffect(() => {
    if (!element) {
      return;
    }

    const newConfig = {
      ...config,
      input: {
        ...config.input
      }
    };

    set(newConfig, `input.${element?.id}`, input);

    if (isEqual(config, newConfig)) {
      return;
    }

    saveConfig(newConfig);
  }, [ input ]);

  const handleRunTask = async () => {

    setRunning(true);
    const camundaApi = { deploy, startInstance, getInstance };

    try {
      const result = await run(element.id, input, camundaApi);
      setOutput(result);
      saveConfig({
        ...config,
        output: {
          ...config.output,
          [element?.id]: result
        }
      });
    } catch (error) {
      setOutput(error);
    } finally {
      setRunning(false);
    }
  };

  if (!element || fetchingVariables) {
    return (
      <div className="task-testing__container">
        <div className="empty">
          <p>Select a single task on the canvas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-testing__container">
      <Input
        element={ element }
        input={ input }
        setInput={ setInput }
        reset={ reset }
        resolvedVariables={ resolvedVariables }
        outputVariables={ outputVariables }
        onRunTask={ handleRunTask }
      />
      <Output
        output={ output }
        running={ running }
      />
    </div>
  );
}
