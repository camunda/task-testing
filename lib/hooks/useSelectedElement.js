import { useState, useEffect } from 'react';

import { is } from 'bpmn-js/lib/util/ModelUtil.js';

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
  }, [ ]);

  const handleSelection = ({ newSelection }) => {
    if (newSelection.length === 1 && is(newSelection[0], 'bpmn:Task')) {
      setSelectedElement(newSelection[0]);
    } else {
      setSelectedElement(null);
    }
  };

  return selectedElement;
}