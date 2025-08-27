import React from 'react';

import { Button } from '@carbon/react';
import { Reset } from '@carbon/icons-react';

import InputEditor from './InputEditor';

export default function Input({
  element,
  input,
  onErrorChange,
  output,
  resetInput,
  setInput,
  variablesForElement
}) {
  const onClickReset = () => {
    resetInput();
  };

  return (
    <div className="input">
      <div className="input__header">
        <div className="input__header--title">
          Configure variables
        </div>
        <div className="input__header--buttons">
          <Button
            kind="ghost"
            onClick={ onClickReset }
            size="sm"
            renderIcon={ Reset }
            hasIconOnly
            tooltipPosition="right"
            iconDescription="Reset input"
          >Reset</Button>
        </div>
      </div>
      <InputEditor
        element={ element }
        value={ input }
        onChange={ setInput }
        onErrorChange={ onErrorChange }
        output={ output }
        variablesForElement={ variablesForElement }
      />
    </div>
  );
}