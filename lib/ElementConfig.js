import EventEmitter from 'events';

import { getBusinessObject, is, isAny } from 'bpmn-js/lib/util/ModelUtil';

import { isString, omit } from 'min-dash';

const DEFAULT_CONFIG = {
  input: {},
  output: {}
};

const SUPPORTED_ELEMENT_TYPES = [ 'bpmn:Task' ];

const DEFAULT_OUTPUT = null;

export class ElementConfig extends EventEmitter {
  constructor(injector, elementVariables, config = DEFAULT_CONFIG) {
    super();

    this._injector = injector;
    this._elementVariables = elementVariables;

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

  async getInputConfigForElement(element) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }

    if (!isString(this._config.input[element.id])) {
      return this._getDefaultInputConfig(element);
    }

    return this._config.input[element.id];
  }

  getOutputConfigForElement(element) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }

    if (!this._config.output[element.id]) {
      return DEFAULT_OUTPUT;
    }

    return this._config.output[element.id];
  }

  async _getDefaultInputConfig(element) {
    const variables = await this._elementVariables.getVariablesForElement(element);

    return createDefaultInputConfig(
      element,
      variables
    );
  }
}

/**
 * Get input parameters from a BPMN element.
 *
 * @param {import('./types').Element} element
 *
 * @returns {import('./types').ModdleElement[]}
 */
function getInputParameters(element) {
  const businessObject = getBusinessObject(element);

  const extensionElements = businessObject.get('extensionElements');

  if (!extensionElements) {
    return [];
  }

  const values = extensionElements.get('values');

  if (!values) {
    return [];
  }

  const ioMapping = values.find(value => is(value, 'zeebe:IoMapping'));

  if (!ioMapping) {
    return [];
  }

  return ioMapping.get('inputParameters');
}

/**
 * Unflatten an object with dot notation keys into a nested object.
 *
 * Example:
 *
 * ```
 * unflatten({
 *   'foo.bar': 'baz'
 * }) // returns { foo: { bar: 'baz' } }
 * ```
 *
 * @param {Object} obj
 *
 * @returns {Object}
 */
function unflatten(obj) {
  const result = {};

  for (const [ path, value ] of Object.entries(obj)) {
    const parts = path.split('.');

    const lastKey = parts.pop();

    let current = result;

    for (const part of parts) {
      if (!(part in current)) {
        current[ part ] = {};
      }

      current = current[ part ];
    }

    current[ lastKey ] = value;
  }

  return result;
}

/**
 * Create default input config for a BPMN element.
 *
 * @todo Only simple input parameter sources can be handled until
 * https://github.com/bpmn-io/internal-docs/issues/1218 is implemented.
 *
 * @param {import('./types').Element} element
 * @param {import('./types').Variable[]} variablesForElement
 *
 * @returns {string}
 */
export function createDefaultInputConfig(element, variablesForElement) {
  const inputParameters = getInputParameters(element);

  const foundVariables = inputParameters.reduce((foundVariables, inputParameter) => {
    const source = inputParameter.get('source'),
          target = inputParameter.get('target');

    const variable = variablesForElement.find(({ name }) => name === target);

    if (!variable) {
      return foundVariables;
    }

    const { name, type } = variable;

    // for context inputs, we cannot determine the structure, so we
    // just create an empty object
    if (type === 'Context') {
      return { ...foundVariables, [name]: {} };
    }

    // only handle simple sources for now
    if (isFeel(source) && !isBoolean(source)) {
      const nameFromSource = getNameFromSource(source);

      if (nameFromSource) {
        return { ...foundVariables, [nameFromSource]: '' };
      }
    }

    return foundVariables;
  }, {});

  return JSON.stringify(unflatten(foundVariables), null, 2);
}

/**
 * Get the name from a source string.
 *
 * @example
 *
 * getNameFromSource('=foo') // 'foo'
 * getNameFromSource('=foo + bar') // null
 * getNameFromSource('= 1 + 2') // null
 *
 * @param {string} source
 *
 * @returns {string|null}
 */
function getNameFromSource(source) {
  if (source && isFeel(source)) {
    const name = source.slice(1).trim();

    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      return name;
    }
  }

  return null;
}

/**
 * Check if a source string is a FEEL expression.
 *
 * @example
 *
 * isFeel('=foo') // true
 * isFeel('= 1 + 2') // true
 * isFeel('foo') // false
 *
 * @param {string} source
 *
 * @returns {boolean}
 */
function isFeel(source) {
  return !!source && source.startsWith('=');
}

/**
 * Check if a source string is a boolean FEEL expression.
 *
 * @example
 *
 * isBoolean('=true') // true
 * isBoolean('= false') // true
 * isBoolean('=foo') // false
 * isBoolean('=1 + 2') // false
 *
 * @param {string} source
 *
 * @return {boolean}
 */
function isBoolean(source) {
  return !!source && /^=\s*(true|false)\s*$/i.test(source);
}