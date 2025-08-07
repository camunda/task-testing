import React, { useState } from 'react';

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
  config,
  saveConfig
}) {

  const [ running, setRunning ] = useState(false);

  const element = useSelectedElement(injector);

  const { resolvedVariables, fetchingVariables } = useVariableResolver(injector, element);

  const { input, setInput, reset } = useInput(element, resolvedVariables);

  const { output, setOutput, outputVariables } = useOutput(element);

  const handleRunTask = async () => {

    setRunning(true);
    const camundaApi = { deploy, startInstance, getInstance };

    try {
      const result = await run(element.id, input, camundaApi);
      setOutput(result);
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
