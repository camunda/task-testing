import React from 'react';

import { Button } from '@carbon/react';
import { Reset } from '@carbon/icons-react';

import InputEditor from './InputEditor';

export default function Input({
  allOutputs,
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
          Configure input variables
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
        allOutputs={ allOutputs }
        element={ element }
        value={ input }
        onChange={ setInput }
        onErrorChange={ onErrorChange }
        variablesForElement={ variablesForElement }
      />
    </div>
  );
}