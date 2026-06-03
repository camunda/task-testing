/**
 * @import {
 *   Element
 * } from 'bpmn-js/lib/model/Types';
 */

import React from 'react';

import { Menu, MenuItem } from '@carbon/react';

import { toFeelPath, toFeelValue } from '../../utils/jsonPath';

/**
 * Floating context menu shown when the user clicks a highlighted JSON node in
 * the result editor.
 *
 * Actions are grouped by journey:
 *  - Fix: Add to output mapping, Go to output mapping
 *  - Copy: Copy key, Copy value (FEEL literal), Copy key with path
 *  - Debug: Open in FEEL Playground
 *
 * Delegated actions are hidden when their callback is absent (graceful
 * degradation), mirroring the pattern used elsewhere.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {number} props.x - screen x position to anchor at
 * @param {number} props.y - screen y position to anchor at
 * @param {string} props.path - dotted JSON path, e.g. `result.body.status`
 * @param {*} props.value - parsed value at the path
 * @param {string} [props.propKey] - the last named segment (property key name)
 * @param {Object} [props.variables] - full result context for FEEL Playground
 * @param {Element} props.element - the currently selected element
 * @param {() => void} props.onClose
 * @param {() => void} [props.onCopy] - called after any clipboard write
 * @param {(element: Element, sourceFeelExpression: string, targetName: string) => void} [props.onAppendOutputMapping]
 * @param {(element: Element, targetName: string) => void} [props.onNavigateToOutputMapping]
 */
export default function ResultActionMenu({
  open,
  x,
  y,
  path,
  value,
  propKey,
  variables,
  element,
  onClose,
  onCopy,
  onAppendOutputMapping,
  onNavigateToOutputMapping
}) {
  const feelPath = `= ${toFeelPath(path)}`;
  const targetName = propKey || '';

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    onCopy?.();
    onClose();
  };

  const openPlayground = () => {
    const url = new URL('https://nikku.github.io/feel-playground/');
    url.searchParams.set('expression', toFeelPath(path));
    url.searchParams.set('contextString', JSON.stringify(variables || {}));
    url.searchParams.set('dialect', 'expression');
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Menu
      className="result-action-menu"
      label="Result actions"
      size="sm"
      open={ open }
      x={ x }
      y={ y }
      onClose={ onClose }
    >
      { onAppendOutputMapping && targetName && (
        <MenuItem
          label="Add to output mapping"
          onClick={ () => {
            onAppendOutputMapping(element, feelPath, targetName);
            onClose();
          } }
        />
      ) }
      { onNavigateToOutputMapping && targetName && (
        <MenuItem
          label="Go to output mapping"
          onClick={ () => {
            onNavigateToOutputMapping(element, targetName);
            onClose();
          } }
        />
      ) }
      { targetName && (
        <MenuItem
          label="Copy key"
          onClick={ () => copy(targetName) }
        />
      ) }
      <MenuItem
        label="Copy value"
        onClick={ () => copy(toFeelValue(value)) }
      />
      <MenuItem
        label="Copy key with path"
        onClick={ () => copy(feelPath) }
      />
      <MenuItem
        label="Open in FEEL Playground"
        onClick={ openPlayground }
      />
    </Menu>
  );
}

