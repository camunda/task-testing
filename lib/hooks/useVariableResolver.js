import { useEffect, useState, useMemo } from 'react';
import { SCOPES } from '../TaskExecution';

/**
 * @typedef {Object} ResolvedVariable
 * @property {string} name
 * @property {string} type
 * @property {string} [detail]
 * @property {string} [info]
 * @property {boolean} [isList]
 * @property {ResolvedVariable[]} [entries]
 * @property {import('../types').BpmnElement} [scope]
 * @property {import('../types').BpmnElement[]} [origin]
 */

/**
 * Use [bpmn-io/variable-resolver](https://github.com/bpmn-io/variable-resolver)
 * to fetch and cache variables for BPMN elements.
 *
 * @param {*} injector
 * @param {import("../types").BpmnElement} element
 *
 * @return {import("../types").Variables}
 */
export function useVariableResolver(injector, element) {

  const [ variables, setVariables ] = useState({});

  const variableResolver = useMemo(() => injector.get('variableResolver'), [ injector ]);
  const eventBus = useMemo(() => injector.get('eventBus'), [ injector ]);

  useEffect(() => {
    eventBus.on('commandStack.changed', () => {
      fetchVariables();
    });
  }, [ eventBus ]);

  useEffect(() => {
    fetchVariables();
  }, [ element ]);

  const fetchVariables = async () => {

    /** @type {ResolvedVariable[]} */
    const resolvedVariables = await variableResolver.getVariablesForElement(element)
      .catch(() => {
        return [];
      });

    const vars = resolvedVariables.reduce((acc, resolvedVariable) => {
      const key = generateKey();
      const variable = parseResolvedVariable(resolvedVariable);
      acc[key] = variable;
      return acc;
    }, {});

    setVariables(vars);
  };

  return variables;
}

/**
 *
 * @param {ResolvedVariable} resolvedVariable
 * @return {import('../types').Variable}
 */
function parseResolvedVariable(resolvedVariable) {
  const {
    name,
    type,
    origin
  } = resolvedVariable;

  /** @type {import('../types').VARIABLE_SOURCE} */
  const source = 'PROCESS';
  const sourceElement = origin?.[0];

  const variable = {
    name: name,
    value: parseValue(resolvedVariable),
    scope: SCOPES.PROCESS,
    type: parseType(type),
    source,
    sourceElementName: sourceElement?.name || sourceElement?.id
  };

  return variable;
}

function generateKey() {
  return Math.random().toString(16).slice(2);
}

/** @returns {import('../types').VARIABLE_TYPE} */
function parseType(type) {
  switch (type) {
  case 'String':
    return 'String';
  case 'Number':
    return 'Number';
  case 'Boolean':
    return 'Boolean';
  case 'Context':
    return 'Object';
  default:
    return 'Object';
  }
}

function parseValue(resolvedVariable) {
  const { info, type } = resolvedVariable;

  if (type === 'Number') {
    return Number(info);
  }

  if (type === 'Boolean') {
    return info === 'true';
  }

  if (type === 'Context') {
    return {};
  }

  return info;
}