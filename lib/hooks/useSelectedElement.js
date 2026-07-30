import { useState, useEffect } from 'react';

import {
  isAny
} from 'bpmn-js/lib/util/ModelUtil';

import { SUPPORTED_ELEMENT_TYPES } from '../utils/element';

/**
 * @typedef {Object} SelectionInfo
 * @property {string} [title]
 * @property {string} message
 */

const SINGLE_TASK_SELECTION_REQUIRED = {
  message: 'Select a task, subprocess, or call activity to start testing.'
};

const UNSUPPORTED_ELEMENT_SELECTED = {
  title: 'Unsupported element',
  message: 'Task testing is only supported for tasks, subprocesses, and call activities. Select one to start testing.'
};

/**
 * Get currently selected BPMN element, if it is a single supported element. If
 * not, return null and a selection info object with an optional title and a
 * message indicating what to do.
 *
 * @param {Object} injector
 *
 * @returns {[ Object|null, SelectionInfo|null ]}
 */
export function useSelectedElement(injector) {
  const [ selectedElement, setSelectedElement ] = useState(null);

  /** @type {[ SelectionInfo|null, Function ]} */
  const [ selectionInfo, setSelectionInfo ] = useState(SINGLE_TASK_SELECTION_REQUIRED);

  useEffect(() => {
    const selection = injector.get('selection');

    handleSelection({ newSelection: selection.get() });

    const eventBus = injector.get('eventBus');

    eventBus.on('selection.changed', handleSelection);

    return () => {
      eventBus.off('selection.changed', handleSelection);
    };
  }, [ injector ]);

  const handleSelection = ({ newSelection }) => {
    const error = validateSelection(newSelection);

    if (error) {
      setSelectedElement(null);
      setSelectionInfo(error);
      return;
    }

    setSelectedElement(newSelection[0]);
    setSelectionInfo(null);
  };

  return [ selectedElement, selectionInfo ];
}

function validateSelection(selection) {
  if (selection.length !== 1) {
    return SINGLE_TASK_SELECTION_REQUIRED;
  }

  if (!isAny(selection[0], SUPPORTED_ELEMENT_TYPES)) {
    return UNSUPPORTED_ELEMENT_SELECTED;
  }

  return null;
}
