/**
 * @import {
 *   ElementOutputVariables,
 *   VARIABLE_SCOPE
 * } from '../types';
 */

import { has, isObject } from 'min-dash';

/**
 * @type {{ LOCAL: 'LOCAL', PROCESS: 'PROCESS' }}
 */
export const SCOPES = {
  LOCAL: 'LOCAL',
  PROCESS: 'PROCESS'
};

/**
 * Get scoped variables from raw API response items.
 *
 * @param {Array} variableItems
 * @param {Array} elementInstanceItems
 * @param {string} processInstanceKey
 * @param {string} elementId
 *
 * @returns {ElementOutputVariables}
 */
export function getVariables(variableItems, elementInstanceItems, processInstanceKey, elementId) {

  /** @type {ElementOutputVariables} */
  const variables = {};

  for (const item of variableItems) {
    const { name, value, variableKey } = item;

    const scope = getScope(item, elementInstanceItems, processInstanceKey, elementId);

    try {
      variables[variableKey] = {
        name,
        value: JSON.parse(value),
        scope
      };
    } catch {
      variables[variableKey] = {
        name,
        value,
        scope
      };
    }
  }

  return variables;
}

/**
 * @param {Object} variable
 * @param {Array} elementInstances
 * @param {string} processInstanceKey
 * @param {string} elementId
 *
 * @returns {VARIABLE_SCOPE}
 */
function getScope(variable, elementInstances, processInstanceKey, elementId) {
  const { scopeKey } = variable;

  const elementInstance = elementInstances.find(elementInstance => {
    return elementInstance.elementInstanceKey === scopeKey && elementInstance.elementId === elementId;
  });

  if (elementInstance) {
    return SCOPES.LOCAL;
  }

  if (scopeKey === processInstanceKey) {
    return SCOPES.PROCESS;
  }

  return null;
}

/**
 * Pick variables for a given scope. Variables in legacy format are ignored.
 *
 * @param {ElementOutputVariables} variables
 * @param {string} scope
 *
 * @returns {Object}
 */
export function pickVariables(variables, scope) {
  return Object.values(variables).reduce((acc, variable) => {

    if (isObject(variable) && has(variable, 'name') && scope === variable.scope) {
      acc[variable.name] = variable.value;
    }

    return acc;
  }, {});
}
