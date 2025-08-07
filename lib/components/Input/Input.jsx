import React, { useState } from 'react';

import { Link } from '@carbon/react';
import { Launch } from '@carbon/icons-react';

import InputEditor from './InputEditor';
import Button from '../Button/Button';

export default function Input({
  element,
  input,
  setInput,
  variables,
  onRunTask,
}) {

  const [ error, setError ] = useState(false);

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
          value={ input }
          onChange={ setInput }
          onErrorChange={ setError }
          variables={ variables }
        />
      </div>
    </div>
  );
}
