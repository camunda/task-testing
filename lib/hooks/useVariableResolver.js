import { useMemo, useState, useEffect } from 'react';

import ZeebeVariableResolver from '@bpmn-io/variable-resolver/lib/zeebe/VariableResolver';

/**
 * Get all process variables available for the given element.
 */
export function useVariableResolver(injector, element) {

  const [ fetching, setFetching ] = useState(false);

  const variableResolver = useMemo(() => {
    const eventBus = injector.get('eventBus');
    const bpmnjs = injector.get('bpmnjs');
    const resolver = new ZeebeVariableResolver(eventBus, bpmnjs);
    return resolver;
  }, [ injector ]);

  const [ variables, setVariables ] = useState();

  useEffect(() => {
    if (!element) {
      return;
    }

    const fetchVariables = async () => {
      try {
        setFetching(true);
        const res = await variableResolver.getVariablesForElement(element);
        setVariables(res);
      } catch (err) {
        setVariables([]);
      } finally {
        setFetching(false);
      }
    };

    fetchVariables();
  }, [ element, variableResolver ]);

  return {
    variables,
    fetching
  };
}
