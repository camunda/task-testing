import React, { useState, useMemo } from 'react';

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

  const [ loading, setLoading ] = useState(false);

  const element = useSelectedElement(injector);
  const { variables, fetching: loadingVariables } = useVariableResolver(injector, element);
  const { input, setInput } = useInput(element, variables);
  const { output, setOutput, outputVariables } = useOutput(element);

  const autocompletion = useMemo(() => {

    console.log('resolved', variables);
    console.log('outputVariables', outputVariables);

    const resolved = variables?.map(({ name, detail, info }) => ({
      label: name,
      type: 'variable',
      info: () => createInfoNode(info),
      detail: detail ? `[${detail}]` : undefined,
      value: info ? info : undefined,
    })) ?? [];

    const outputs = Object.entries(outputVariables)?.map(([ name, { value, source } ]) => ({
      label: name,
      type: 'constant',
      info: () => createInfoNode(value, source),
      detail: `[${typeof value}]`,
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : value.toString(),
    }));

    return [ ...resolved, ...outputs ];

  }, [ variables, outputVariables ]);

  const handleRunTask = async () => {

    setLoading(true);
    const camundaApi = { deploy, startInstance, getInstance };

    try {
      const result = await run(element.id, input, camundaApi);
      setOutput(result);
    } catch (error) {
      setOutput(error);
    } finally {
      setLoading(false);
    }
  };

  if (!element || loadingVariables) {
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
        variables={ autocompletion }
        onRunTask={ handleRunTask }
      />
      <Output
        output={ output }
        loading={ loading }
      />
    </div>
  );
}

function createInfoNode(value, source) {
  const div = document.createElement('div');
  div.className = 'info';

  const header = document.createElement('span');
  if (source) {
    header.textContent = `From the previous run of "${source}"`;
  } else {
    header.textContent = 'From process variables';
  }

  div.appendChild(header);

  if (!value) {
    return div;
  }

  const content = document.createTextNode(`\n\n${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`);
  div.appendChild(content);

  return div;
}
