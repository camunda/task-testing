import EventEmitter from 'events';

import { getBusinessObject, is, isAny } from 'bpmn-js/lib/util/ModelUtil';
import { omit } from 'min-dash';

const DEFAULT_CONFIG = {
  input: {},
  output: {}
};

const SUPPORTED_ELEMENT_TYPES = [ 'bpmn:Task' ];

const DEFAULT_OUTPUT = {};

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

  async getInputConfigForElement(element) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }

    if (!this._config.input[element.id]) {
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
 * @param {import('../types').Element} element
 *
 * @returns {import('../types').ModdleElement[]}
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

function createDefaultInputConfig(element, variablesForElement) {
  const inputParameters = getInputParameters(element);

  const foundVariables = inputParameters.reduce((foundVariables, { target, source }) => {
    const variable = variablesForElement.find(({ name }) => name === target);

    if (!variable) {
      return foundVariables;
    }

    const { name, type, info } = variable;

    if (type === 'Context') {

      // TODO: Resolve context variables once supported
      return { ...foundVariables, [name]: {} };
    }

    if (!type && !info && source?.startsWith('=')) {

      // TODO: Remove once https://github.com/bpmn-io/variable-resolver/issues/52 is fixed
      if (source === '=false') {
        return foundVariables;
      }

      return { ...foundVariables, [ source.startsWith('=') ? source.slice(1) : source ]: '' };
    }

    return foundVariables;
  }, {});

  return JSON.stringify(unflatten(foundVariables), null, 2);
}