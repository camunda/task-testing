import { has, isObject, isString } from 'min-dash';

export const DEFAULT_INPUT_CONFIG = '{}';


/**
 * Compute a default input config from the element's input requirements, producing a JSON string with `null` stubs for each required variable.
 *
 * @param {Object} elementVariables
 * @param {Object} element
 * @returns {Promise<string>} JSON string
 */
export async function computeDefaultInput(elementVariables, element) {
  const stub = await buildRequirementsStub(elementVariables, element);

  if (Object.keys(stub).length === 0) {
    return DEFAULT_INPUT_CONFIG;
  }

  return JSON.stringify(stub, null, 2);
}


/**
 * Merge current input with fresh input requirements from the element. User edits have higher priority.
 *
 * @param {string} currentInputString - stored JSON string (or undefined)
 * @param {Object} elementVariables
 * @param {Object} element
 * @returns {Promise<string|null>} merged JSON string, or null if unparseable
 */
export async function computeMergedInput(currentInputString, elementVariables, element) {
  const requirementsStub = await buildRequirementsStub(elementVariables, element);

  const inputString = isString(currentInputString)
    ? currentInputString
    : DEFAULT_INPUT_CONFIG;

  let currentConfig;
  try {
    currentConfig = JSON.parse(inputString);
  } catch (e) {

    // invalid JSON -> merge not possible
    return null;
  }

  const cleaned = removeNullValues(currentConfig);
  const merged = mergeObjects(requirementsStub, cleaned);

  if (Object.keys(merged).length === 0) {
    return DEFAULT_INPUT_CONFIG;
  }

  return JSON.stringify(merged, null, 2);
}


/**
 * Generate stubs for the consumed variables, uses `null` for leaves.
 *
 * @param {Object} elementVariables
 * @param {Object} element
 * @returns {Promise<Object>} requirements stub
 */
async function buildRequirementsStub(elementVariables, element) {
  const requirements = await elementVariables
    .getConsumedVariablesForElement(element);

  if (!requirements || requirements.length === 0) {
    return {};
  }

  const stub = {};

  for (const variable of requirements) {
    stub[variable.name] = variableToStub(variable);
  }

  return stub;
}

/**
 * Convert a variable with entries (nested context) into object.
 *
 * Produces nested objects for context variables, `null` for leaves.
 *
 * @param {Object} variable
 * @returns {*} stub value
 */
function variableToStub(variable) {
  if (variable.entries && variable.entries.length > 0) {
    const result = {};

    for (const entry of variable.entries) {
      result[entry.name] = variableToStub(entry);
    }

    return result;
  }

  return null;
}

/**
 * Recursively remove all null values from an object
 *
 * If all keys are removed, returns an empty object.
 *
 * @param {Object} obj
 * @returns {Object}
 */
function removeNullValues(obj) {
  if (!isObject(obj)) {
    return obj;
  }

  const result = {};

  for (const key in obj) {
    if (!has(obj, key)) continue;

    const value = obj[key];

    if (value === null) continue;

    if (isObject(value)) {
      const cleaned = removeNullValues(value);

      if (Object.keys(cleaned).length > 0) {
        result[key] = cleaned;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Merge two objects:
 *   base provides the structure (stubs),
 *   override provides user values.
 *
 *
 * @param {Object} base - requirements stub (may contain null values)
 * @param {Object} override - user input (cleaned of nulls)
 * @returns {Object}
 */
function mergeObjects(base, override) {
  const result = { ...base };

  for (const key in override) {
    if (!has(override, key)) continue;

    const overrideValue = override[key];
    const baseValue = result[key];

    if (isObject(overrideValue) && isObject(baseValue)) {
      result[key] = mergeObjects(baseValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  }

  return result;
}
