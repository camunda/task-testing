import { useState, useCallback, useEffect } from 'react';

import { getInputMapping } from '../utils/inputMapping.js';

/**
 * Get and set input variables for the given element,
 * based on the input mapping and available process variables.
 *
 * @param {*} element - BPMN element
 * @param {Array} variables - Available process variables
 */
export function useInput(element, variables) {

  const [ input, setInput ] = useState({});
  const [ dirty, setDirty ] = useState({});

  useEffect(() => {
    if (!element || dirty[element?.id]) {
      return;
    }

    const inputMapping = getInputMapping(element);

    if (!inputMapping) {
      return;
    }

    const values = inputMapping.reduce((acc, { target, source }) => {

      const feelValue = getFeelValue(source);

      if (!feelValue) {
        return { ...acc, [target]: source };
      }

      if (isFeelConstant(feelValue)) {
        return { ...acc, [target]: feelValue };
      }

      const knownVariable = variables?.find(variable => variable.name === target);

      if (!knownVariable) {
        console.log('no known variable for', target);
        return { ...acc, [feelValue]: '' };
      }

      if (knownVariable.type === 'Context' && knownVariable.entries) {
        const sourceEntries = Object.fromEntries(knownVariable.entries.map(entry => [ entry.name, '' ]));
        return { ...acc, ...sourceEntries };
      }

      if (knownVariable.info) {
        return { ...acc, [target]: knownVariable.info };
      }

      return { ...acc, [feelValue]: '' };
    }, {});

    // Convert flat object with dot notation to nested object
    const nestedValues = Object.entries(values).reduce((acc, [ key, value ]) => {
      const keys = key.split('.');
      let current = acc;

      for (let i = 0; i < keys.length - 1; i++) {
        const keyPart = keys[i];
        if (!(keyPart in current)) {
          current[keyPart] = {};
        }
        current = current[keyPart];
      }

      current[keys[keys.length - 1]] = value;
      return acc;
    }, {});

    setInput(prev => ({
      ...prev,
      [element.id]: JSON.stringify(nestedValues, null, 2)
    }));
  }, [ element, variables ]);

  const handleInput = useCallback((value) => {
    setInput(prev => ({
      ...prev,
      [element.id]: value
    }));

    setDirty(prev => ({
      ...prev,
      [element.id]: true
    }));

  }, [ element ]);

  return {
    input: input[element?.id],
    setInput: handleInput,
  };
}

function getFeelValue(string) {
  return string.startsWith('=') ? string.slice(1) : null;
}

function isFeelConstant(value) {

  if (!isNaN(parseInt(value))) {
    return true;
  }

  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
    return true;
  }

  return false;
}