import EventEmitter from 'events';

import { isAny } from 'bpmn-js/lib/util/ModelUtil';

import { has, isObject, isString, omit } from 'min-dash';

export const DEFAULT_CONFIG = {
  input: {},
  output: {}
};

const SUPPORTED_ELEMENT_TYPES = [ 'bpmn:Task' ];

const DEFAULT_OUTPUT = undefined;

export class ElementConfig extends EventEmitter {
  constructor(injector, elementVariables, config = DEFAULT_CONFIG) {
    super();

    this._injector = injector;
    this._elementVariables = elementVariables;

    /**
     * @type {import('./types').Config}
     */
    this._config = {
      ...DEFAULT_CONFIG,
      ...config
    };

    this._selectedElement = null;
    this._variablesForElements = new Map();
  }

  setConfig(newConfig) {
    this._config = newConfig;

    this.emit('config.changed');
  }

  getConfig() {
    return this._config;
  }

  setInputConfigForElement(element, newConfig) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }

    this._config = {
      ...this._config,
      input: {
        ...this._config.input,
        [element.id]: newConfig
      }
    };

    this.emit('config.changed', { config: this._config });
  }

  resetInputConfigForElement(element) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }

    this._config = {
      ...this._config,
      input: omit(this._config.input, element.id)
    };

    this.emit('config.changed');
  }

  setOutputConfigForElement(element, newConfig) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }

    this._config = {
      ...this._config,
      output: {
        ...this._config.output,
        [element.id]: newConfig
      }
    };

    this.emit('config.changed');
  }

  resetOutputConfigForElement(element) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }

    this._config = {
      ...this._config,
      output: omit(this._config.output, element.id)
    };

    this.emit('config.changed');
  }

  getInputConfigForElement(element) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }

    if (!isString(this._config.input[element.id])) {
      return this._getDefaultInputConfig();
    }

    return this._config.input[element.id];
  }

  /**
   * Returns a prefilled input config for the given element based on
   * the input requirements extracted from its expressions.
   * If the element has no stored config, the returned JSON will contain
   * stub entries for all variables referenced in input mappings / scripts.
   *
   * @param {Object} element
   * @returns {Promise<string>} JSON string
   */
  async getPrefilledInputConfigForElement(element) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }

    // If user already has a stored config, return it as-is
    if (isString(this._config.input[element.id])) {
      return this._config.input[element.id];
    }

    return this._computePrefilledInput(element);
  }

  /**
   * Always computes a fresh prefilled input config from the element's
   * input requirements, ignoring any stored user config.
   *
   * @param {Object} element
   * @returns {Promise<string>} JSON string
   */
  async getAutoPrefilledInputForElement(element) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }

    return this._computePrefilledInput(element);
  }

  /**
   * @param {Object} element
   * @returns {Promise<string>} JSON string
   */
  async _computePrefilledInput(element) {
    const requirements = await this._elementVariables
      .getInputRequirementsForElement(element);

    if (!requirements || requirements.length === 0) {
      return this._getDefaultInputConfig();
    }

    const prefill = {};

    for (const variable of requirements) {
      prefill[variable.name] = variableToStub(variable);
    }

    return JSON.stringify(prefill, null, 2);
  }

  /**
   * Merges current user input with fresh input requirements from the element.
   * Removes null values (unfilled stubs) from user input, then adds new
   * requirement stubs for any variables not yet present.
   *
   * Returns `null` when the current input is invalid JSON, signalling that
   * no merge was possible and the caller should skip overwriting the config.
   *
   * @param {Object} element
   * @returns {Promise<string|null>} merged JSON string, or null if current input is unparseable
   */
  async getMergedInputConfigForElement(element) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }

    const requirements = await this._elementVariables
      .getInputRequirementsForElement(element);

    // Build the requirements stub
    const requirementsStub = {};

    if (requirements && requirements.length > 0) {
      for (const variable of requirements) {
        requirementsStub[variable.name] = variableToStub(variable);
      }
    }

    // Parse current user input
    const currentConfigString = isString(this._config.input[element.id])
      ? this._config.input[element.id]
      : '{}';

    let currentConfig;
    try {
      currentConfig = JSON.parse(currentConfigString);
    } catch (e) {

      // If user input is invalid JSON, signal that no merge is possible
      return null;
    }

    // Remove null values from user input, then merge with requirements
    const cleaned = removeNullValues(currentConfig);
    const merged = mergeObjects(requirementsStub, cleaned);

    return JSON.stringify(merged, null, 2);
  }

  /**
   * @param {import('./types').Element} element
   * @returns {import('./types').ElementOutput}
   */
  getOutputConfigForElement(element) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }

    if (!this._config.output[element.id]) {
      return DEFAULT_OUTPUT;
    }

    return this._config.output[element.id];
  }

  _getDefaultInputConfig() {
    return '{}';
  }
}


// helpers //////////////////////

/**
 * Convert a variable with entries (nested context) into a JSON stub value.
 * Uses `info` (example/computed value) and `type` to produce a typed value
 * instead of null when available.
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

  // Use example/computed value from variable intelligence when available
  if (variable.info) {
    return infoToValue(variable.info, variable.type || variable.detail);
  }

  return null;
}

/**
 * Convert a variable's info string to a typed JSON value based on its type.
 *
 * @param {string} info - string representation of the value
 * @param {string} [type] - type hint (e.g. "Number", "Boolean", "String")
 * @returns {*} typed value
 */
function infoToValue(info, type) {
  switch (type) {
  case 'Number': {
    const num = Number(info);
    return isNaN(num) ? info : num;
  }
  case 'Boolean':
    return info === 'true';
  case 'String':
    return info;
  default: {

    // Try to parse as JSON for objects/arrays
    try {
      return JSON.parse(info);
    } catch (e) {
      return info;
    }
  }
  }
}

/**
 * Recursively remove all null values from an object.
 * Removes keys whose value is null, and recurses into nested objects.
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
 * Merge two objects: base provides the structure (stubs), override
 * provides user values. User values take precedence.
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