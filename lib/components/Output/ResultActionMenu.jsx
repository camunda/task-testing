/**
 * @import {
 *   Element
 * } from 'bpmn-js/lib/model/Types';
 */

import React from 'react';

import { Menu, MenuItem } from '@carbon/react';

import { toFeelPath } from '../../utils/jsonPath';

/**
 * Floating context menu shown near the current result selection. Lets the user
 * act on the resolved JSON node (key, value or subtree).
 *
 * Delegated actions (_Save as example data_, _Append to output mapping_) are
 * only shown when their callback is provided, mirroring the graceful
 * degradation used elsewhere (e.g. `onConfigureConnection`).
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {number} props.x - screen x position to anchor at
 * @param {number} props.y - screen y position to anchor at
 * @param {string} props.path - dotted JSON path, e.g. `result.flags.racist`
 * @param {*} props.value - parsed value at the path
 * @param {Element} props.element - the currently selected element
 * @param {() => void} props.onClose
 * @param {(element: Element, path: string, value: *) => void} [props.onAddToExampleData]
 * @param {(element: Element, sourceFeelExpression: string, targetName: string) => void} [props.onAppendOutputMapping]
 */
export default function ResultActionMenu({
  open,
  x,
  y,
  path,
  value,
  element,
  onClose,
  onAddToExampleData,
  onAppendOutputMapping
}) {
  const feelPath = `= ${toFeelPath(path)}`;

  // The variable name to map to: the last path segment.
  const targetName = getLastSegment(path);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
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
      <MenuItem
        label="Copy as JSON"
        onClick={ () => copy(JSON.stringify(value, null, 2)) }
      />
      <MenuItem
        label="Copy as FEEL"
        onClick={ () => copy(feelPath) }
      />
      <MenuItem
        label="Copy path"
        onClick={ () => copy(path) }
      />
      {
        onAddToExampleData && (
          <MenuItem
            label="Save as example data"
            onClick={ () => {
              onAddToExampleData(element, path, value);
              onClose();
            } }
          />
        )
      }
      {
        onAppendOutputMapping && targetName && (
          <MenuItem
            label="Append to output mapping"
            onClick={ () => {
              onAppendOutputMapping(element, feelPath, targetName);
              onClose();
            } }
          />
        )
      }
    </Menu>
  );
}

/**
 * @param {string} path
 * @returns {string}
 */
function getLastSegment(path) {
  if (!path) {
    return '';
  }

  const tokens = path.match(/[^.[\]]+|\[\d+\]/g) || [];

  for (let i = tokens.length - 1; i >= 0; i--) {
    if (!tokens[i].startsWith('[')) {
      return tokens[i];
    }
  }

  return '';
}
