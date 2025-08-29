import React, { createContext, useState, useMemo, useEffect } from 'react';

import ZeebeVariableResolver from '@bpmn-io/variable-resolver/lib/zeebe/VariableResolver';

import { useSelectedElement } from '../hooks/useSelectedElement';

export const ElementVariablesContext = createContext([]);

export function ElementVariablesProvider({ injector, children }) {

  const [ variables, setVariables ] = useState([]);

  const element = useSelectedElement(injector);

  const variableResolver = useMemo(() => {
    const bpmnjs = injector.get('bpmnjs');
    const eventBus = injector.get('eventBus');

    return new ZeebeVariableResolver(eventBus, bpmnjs);
  }, [ injector ]);

  useEffect(() => {
    const eventBus = injector.get('eventBus');

    eventBus.on('commandStack.changed', () => {
      setVariables([]);
    });

    return () => {
      eventBus.off('commandStack.changed');
    };
  }, [ injector ]);

  useEffect(() => {
    if (!element) {
      return;
    }

    variableResolver?.getVariablesForElement(element)
      .then(setVariables);

  }, [ element ]);

  return (
    <ElementVariablesContext.Provider value={ variables }>
      { children }
    </ElementVariablesContext.Provider>
  );
}