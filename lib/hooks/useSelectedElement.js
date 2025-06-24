import { useState, useEffect } from 'react';

import { is } from 'bpmn-js/lib/util/ModelUtil';

export default function useSelectedElement(injector) {

  const [ selectedElement, setSelectedElement ] = useState(null);

  useEffect(() => {
    const eventBus = injector.get('eventBus');

    const handleSelection = ({ newSelection }) => {
      if (newSelection.length === 1 && is(newSelection[0], 'bpmn:Task')) {
        setSelectedElement(newSelection[0]);
      } else {
        setSelectedElement(null);
      }
    };

    eventBus.on('selection.changed', handleSelection);

    return () => {
      eventBus.off('selection.changed', handleSelection);
    };
  }, [ injector ]);

  return selectedElement;
}