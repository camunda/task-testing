import { useState, useEffect } from 'react';

import {
  getBusinessObject,
  is,
  isAny
} from 'bpmn-js/lib/util/ModelUtil';

const SUPPORTED_ELEMENT_TYPES = [ 'bpmn:Task' ];

export const SINGLE_TASK_SELECTION_REQUIRED_MESSAGE = 'Select a task to start testing.';
export const TASK_SELECTION_REQUIRED_MESSAGE = 'Task testing is only supported for tasks. Select a task to start testing.';
export const AD_HOC_SUBPROCESS_TASK_UNSUPPORTED_MESSAGE = 'Task testing is not supported for tasks inside an ad-hoc subprocess. Select a different task to start testing.';

/**
 * Get currently selected BPMN element, if it is a single `bpmn:Task`. If not,
 * return null and a message indicating what to do.
 *
 * @param {Object} injector
 * @return {[ Object|null, string|null ]}
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
    if (newSelection.length !== 1) {
      setSelectedElement(null);
      setMessage(SINGLE_TASK_SELECTION_REQUIRED_MESSAGE);
    } else if (!isAny(newSelection[0], SUPPORTED_ELEMENT_TYPES)) {
      setSelectedElement(null);
      setMessage(TASK_SELECTION_REQUIRED_MESSAGE);
    } else {
      setSelectedElement(newSelection[0]);
      setMessage(null);
    }
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

  if (isInAdHocSubprocess(selection[0])) {
    return AD_HOC_SUBPROCESS_TASK_UNSUPPORTED_MESSAGE;
  }

  return null;
}

function isInAdHocSubprocess(element) {
  const bo = getBusinessObject(element);
  let parent = getParent(bo);

  while (parent) {
    if (is(parent, 'bpmn:AdHocSubProcess')) {
      return true;
    }
    parent = getParent(parent);
  }

  return false;
}

function getParent(bo) {
  return bo.$parent;
}
