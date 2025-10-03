import React from 'react';

import { Button, Link } from '@carbon/react';
import { Reset, Launch } from '@carbon/icons-react';

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
          Process variables
        </div>
        <Link href="https://docs.camunda.io/docs/components/concepts/variables/" target="_blank" title="Open documentation">
          <Launch />
        </Link>
        <Button
          className="input__header--button-reset"
          kind="ghost"
          onClick={ handleResetInput }
          size="sm"
          renderIcon={ Reset }
          hasIconOnly
          tooltipPosition="left"
          iconDescription="Clear"
        />
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