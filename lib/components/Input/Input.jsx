import React from 'react';

import { Link } from '@carbon/react';
import { Launch } from '@carbon/icons-react';

import InputEditor from './InputEditor';

export default function Input({
  allOutputs,
  input = '',
  onErrorChange,
  onResetInput,
  onSetInput,
  variablesForElement
}) {
  const handleResetInput = () => {
    onResetInput();
  };

  return (
    <div className="input">
      <div className="input__header">
        <div className="input__header--title">
          Input process variables
        </div>
        <Link href="https://docs.camunda.io/docs/components/concepts/variables/" target="_blank" title="Open documentation">
          <Launch />
        </Link>
        <Link
          className="input__header--button-reset"
          onClick={ handleResetInput }
          role="button">Clear</Link>
      </div>
      <InputEditor
        allOutputs={ allOutputs }
        value={ input }
        onChange={ onSetInput }
        onErrorChange={ onErrorChange }
        variablesForElement={ variablesForElement }
      />
    </div>
  );
}