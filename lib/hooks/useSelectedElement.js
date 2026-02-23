import { useState, useEffect } from 'react';

import {
  isAny
} from 'bpmn-js/lib/util/ModelUtil';

const SUPPORTED_ELEMENT_TYPES = [ 'bpmn:Task', 'bpmn:SubProcess' ];

export const SINGLE_TASK_SELECTION_REQUIRED_MESSAGE = 'Select a task or subprocess to start testing.';
export const TASK_SELECTION_REQUIRED_MESSAGE = 'Task testing is only supported for tasks and subprocesses. Select one to start testing.';

/**
 * Get currently selected BPMN element, if it is a single supported element
 * (`bpmn:Task` or `bpmn:SubProcess`). If not, return null and a message
 * indicating what to do.
 *
 * @param {Object} injector
 *
 * @returns {[ Object|null, string|null ]}
 */
export function useSelectedElement(injector) {
  const [ selectedElement, setSelectedElement ] = useState(null);

  /** @type {[ string|null, Function ]} */
  const [ message, setMessage ] = useState(SINGLE_TASK_SELECTION_REQUIRED_MESSAGE);

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
      setMessage(error);
      return;
    }

    setSelectedElement(newSelection[0]);
    setMessage(null);
  };

  return [ selectedElement, message ];
}

function validateSelection(selection) {
  if (selection.length !== 1) {
    return SINGLE_TASK_SELECTION_REQUIRED_MESSAGE;
  }

  if (!isAny(selection[0], SUPPORTED_ELEMENT_TYPES)) {
    return TASK_SELECTION_REQUIRED_MESSAGE;
  }

  return null;
}
