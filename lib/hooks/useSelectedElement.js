import { useState, useEffect } from 'react';

import { isAny } from 'bpmn-js/lib/util/ModelUtil';

const SUPPORTED_ELEMENT_TYPES = [ 'bpmn:Task' ];

/**
 * Get currently selected BPMN element, if it is a single `bpmn:Task`.
 *
 * @param {Object} injector
 * @return {Object|null} Selected BPMN element or null
 */
export function useSelectedElement(injector) {

  const [ selectedElement, setSelectedElement ] = useState(null);

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
    if (newSelection.length === 1 && isAny(newSelection[0], SUPPORTED_ELEMENT_TYPES)) {
      setSelectedElement(newSelection[0]);
    } else {
      setSelectedElement(null);
    }
  };

  return selectedElement;
}