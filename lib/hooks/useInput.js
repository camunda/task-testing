import { useState, useCallback, useEffect } from 'react';

import { getInputMapping } from '../utils/bpmnUtils.js';

/**
 * Get and set input variables for the given element,
 * based on the input mapping and available process variables.
 *
 * @param {*} element - BPMN element
 * @param {*} resolvedVariables - Available process variables
 */
export function useInput(element, resolvedVariables, initialInput = {}) {

  const [ dirty, setDirty ] = useState(() => {
    return Object.keys(inputProp).reduce((acc, key) => {
      acc[key] = !!inputProp[key];
      return acc;
    }, {});
  });

  useEffect(() => {
    if (!element || !resolvedVariables || dirty[element.id]) {
      return;
    }

    setInitialInput();
  }, [ element, resolvedVariables ]);

  /**
   * Create initial input from the BPMN element input mapping.
   */
  const setInitialInput = useCallback(() => {
    const inputMapping = getInputMapping(element) ?? [];

    const value = createFromInputMapping(inputMapping, resolvedVariables);

    setInput(prev => ({
      ...prev,
      [element.id]: value
    }));
  }, [ element, resolvedVariables ]);

  /**
   * Set input for the currently selected element.
   *
   * Mark the input as `dirty` to indicate it has been modified.
   */
  const handleInput = (value) => {
    setInput(prev => ({
      ...prev,
      [element.id]: value
    }));

    setDirty(prev => ({
      ...prev,
      [element.id]: true
    }));
  };

  /**
   * Set input back to the initial values based on the BPMN element input mapping.
   */
  const handleReset = useCallback(() => {

    setInitialInput();

    setDirty(prev => ({
      ...prev,
      [element.id]: false
    }));
  }, [ element, setInitialInput ]);

  return {
    input: input[element?.id],
    setInput: handleInput,
    reset: handleReset
  };
}


// helpers

function createFromInputMapping(inputMapping, resolvedVariables) {

  const values = inputMapping.reduce((acc, { target, source }) => {

    const variable = resolvedVariables.find(({ name }) => name === target);

    if (!variable) {
      return acc;
    }

    const { name, type, info } = variable;

    if (type === 'Context') {

      // TODO: We can't resolve Context variables yet
      return { ...acc, [name]: {} };
    }

    if (!type && !info && source?.startsWith('=')) {

      // TODO: Remove when https://github.com/bpmn-io/variable-resolver/issues/52 is fixed.
      if (source === '=false') {
        return acc;
      }

      return { ...acc, [source.slice(1)]: '' };
    }

    return acc;
  }, {});

  const nestedValues = parseNestedValues(values);

  return JSON.stringify(nestedValues, null, 2);
}

/**
 * Convert flat object with dot notation to nested object.
 *
 * Example:
 *
 * `{
 *   'foo.bar': 'baz'
 * }`
 * becomes:
 * `{
 *   foo: {
 *     bar: 'baz'
 *   }
 * }`
 */
function parseNestedValues(values) {

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

  return nestedValues;
}