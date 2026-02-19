import React, { useRef } from 'react';

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

  const containerRef = /** @type {import('react').RefObject<HTMLDivElement | null>} */ (useRef(null));

  const handleReset = () => {
    onResetInput();
    const cmContent = /** @type {HTMLElement | undefined} */ (
      containerRef.current?.querySelector('.cm-content')
    );
    cmContent?.focus();
  };

  return (
    <div className="input" ref={ containerRef }>
      <div className="input__header">
        <div className="input__header--title">
          Input process variables
        </div>
        <Link href="https://docs.camunda.io/docs/components/concepts/variables/" target="_blank" title="Open documentation">
          <Launch />
        </Link>
        <Link
          className="input__header--button-reset"
          onClick={ handleReset }
          role="button">Reset</Link>
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