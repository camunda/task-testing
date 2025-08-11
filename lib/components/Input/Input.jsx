import React, { useState, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Link } from '@carbon/react';
import { Launch } from '@carbon/icons-react';

import InputEditor from './InputEditor';
import Button from '../Button/Button';

export default function Input({
  element,
  input,
  setInput,
  reset,
  resolvedVariables = [],
  outputVariables,
  onRunTask,
}) {

  const [ error, setError ] = useState(false);
  const [ resetKey, setResetKey ] = useState(0);

  const autocompletion = useMemo(() => {

    const resolved = resolvedVariables.map(({ name, detail, info }) => ({
      label: name,
      type: 'variable',
      info: () => createInfo(info),
      detail: detail ? `[${detail}]` : undefined,
      value: info ? info : undefined,
    }));

    const outputs = Object.entries(outputVariables)?.map(([ name, { value, source } ]) => ({
      label: name,
      type: 'constant',
      info: () => createInfo(value, source),
      detail: `[${typeof value}]`,
      value: value,
    }));

    return [ ...resolved, ...outputs ];

  }, [ resolvedVariables, outputVariables ]);

  const handleRun = async () => {
    if (error) {
      return;
    }
    await onRunTask(input);
  };

  const handleReset = () => {
    reset();
    setResetKey(prev => prev + 1); // Force InputEditor to re-render
  };

  const elementName = element.name || element.id;

  return (
    <div className="section">
      <div className="section__header">
        <div className="section__header--title">
          <div className="section__header--title-with-icon">
            <p>Test {elementName}</p>
            <Link
              href="https://docs.camunda.io/docs/components/concepts/variables"
              renderIcon={ () => <Launch size="14" /> } />
          </div>
          <p className="cds--label">
            {'Run the selected task with the provided input variables.'}
          </p>
        </div>
        <div className="section__header--buttons">
          <Button
            kind="ghost"
            onClick={ handleReset }
            tooltip="Reset to input mapping"
          >
            Reset
          </Button>
          <Button
            kind="primary"
            onClick={ handleRun }
            tooltip={ error && 'Invalid JSON' }
            skeleton
          >
            Run
          </Button>
        </div>
      </div>
      <div className="section__content">
        <InputEditor
          key={ resetKey }
          value={ input }
          onChange={ setInput }
          onErrorChange={ setError }
          autocompletion={ autocompletion }
        />
      </div>
    </div>
  );
}

function createInfo(value, source) {
  const div = document.createElement('div');

  const htmlString = renderToStaticMarkup(
    <div className="info">
      <span>{source ? `From output variables of "${source}"` : 'From process variables'}</span>
      {value && <pre>{typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</pre>}
    </div>
  );

  div.innerHTML = htmlString;

  return div;
}
