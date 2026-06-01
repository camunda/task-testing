import React, { useRef } from 'react';

import { Link } from '@carbon/react';
import { Information } from '@carbon/icons-react';

import InputEditor from './InputEditor';

import Tooltip from '../shared/Tooltip';

/** @type {string[]} */
const DEFAULT_PREFILL_SOURCES = [];

/**
 * Determine whether the input contains any variables at all. Used to
 * distinguish "prefilled from process variables in scope" from "nothing was
 * prefilled" in the footer copy.
 *
 * @param {string} input - the input JSON string
 * @returns {boolean}
 */
function hasPrefilledVariables(input) {
  try {
    const parsed = JSON.parse(input);
    return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
  } catch (e) {

    // invalid JSON means the user has typed something -> treat as non-empty
    return true;
  }
}

export default function Input({
  allOutputs,
  input = '',
  onErrorChange,
  onResetInput,
  onSetInput,
  prefillSources = DEFAULT_PREFILL_SOURCES,
  variablesForElement,
  connectionName
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
          {
            prefillSources.length > 0
              ? `Prefilled from ${prefillSources.join(', ')}`
              : hasPrefilledVariables(input)
                ? 'Prefilled from process variables in scope.'
                : 'No variables to prefill — add process variables to start with.'
          }
        </div>
      </div>
      <div className="input__run-note">
        This runs your process for real — it deploys to the connected cluster, starts an instance, and executes connectors and side effects.
        { connectionName && ` Testing against ${connectionName}.` }
      </div>
    </div>
  );
}