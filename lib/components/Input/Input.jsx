import React, { useRef } from 'react';

import { Alert, Label } from '@camunda/design-system';

import InputEditor from './InputEditor';

import Tooltip from '../shared/Tooltip';
import Link from '../shared/Link';

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
      <div className="input__header">
        <Tooltip className="has-tooltip" label={ <span>Variables the process instance will be started with. <Link
          href="https://docs.camunda.io/docs/components/concepts/variables/"
          target="_blank"
          rel="noopener noreferrer"
        >Learn more.</Link></span> } align="bottom-start">
          <Label>Process variables</Label>
        </Tooltip>
      </div>
      <InputEditor
        allOutputs={ allOutputs }
        value={ input }
        onChange={ onSetInput }
        onClear={ handleResetInput }
        onErrorChange={ onErrorChange }
        variablesForElement={ variablesForElement }
      />
      <Alert
        variant="info"
        description="Optionally define process variables to start the process instance with."
      />
    </div>
  );
}