import React, { useRef } from 'react';

import { Link } from '@carbon/react';
import { Information } from '@carbon/icons-react';

import InputEditor from './InputEditor';

import Tooltip from '../shared/Tooltip';

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
        <div className="input__header--title">
          <Tooltip className="has-tooltip" label={ <span>Variables the process instance will be started with. <Link
            href="https://docs.camunda.io/docs/components/concepts/variables/"
            target="_blank"
            rel="noopener noreferrer"
          >Learn more.</Link></span> } align="bottom-start">
            <span>Process variables</span>
          </Tooltip>
        </div>
      </div>
      <InputEditor
        allOutputs={ allOutputs }
        value={ input }
        onChange={ onSetInput }
        onClear={ handleResetInput }
        onErrorChange={ onErrorChange }
        variablesForElement={ variablesForElement }
      />
      <div className="input__footer">
        <div className="input__footer--icon">
          <Information />
        </div>
        <div className="input__footer--text">
          Optionally define process variables to start the process instance with.
        </div>
      </div>
    </div>
  );
}