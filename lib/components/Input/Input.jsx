import React, { useRef } from 'react';

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

  const handleResetInput = () => {
    onResetInput();
    const cmContent = /** @type {HTMLElement | undefined} */ (
      containerRef.current?.querySelector('.cm-content')
    );
    cmContent?.focus();
  };

  return (
    <div className="input" ref={ containerRef }>
      <InputEditor
        allOutputs={ allOutputs }
        value={ input }
        onChange={ onSetInput }
        onClear={ handleResetInput }
        onErrorChange={ onErrorChange }
        variablesForElement={ variablesForElement }
      />
    </div>
  );
}