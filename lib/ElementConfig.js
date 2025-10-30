import EventEmitter from 'events';

import { isAny } from 'bpmn-js/lib/util/ModelUtil';

import { isString, omit, reduce, filter } from 'min-dash';

import { isVariable } from './utils/variables';

export const DEFAULT_CONFIG = {
  input: {},
  output: {}
};

const SUPPORTED_ELEMENT_TYPES = [ 'bpmn:Task' ];

const DEFAULT_OUTPUT = undefined;

/**
 * Manage input and output configuration.
 *
 * @extends {EventEmitter}
 */
export class ElementConfig extends EventEmitter {
  constructor(config = DEFAULT_CONFIG) {
    super();

    /**
     * @type {import('./types').Config}
     */
    this._config = {
      ...DEFAULT_CONFIG,
      ...config
    };
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
   * @param {import('./types').BpmnElement} element
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

  /**
   * Get all output variables available in the config.
   * @returns {import('./types').Variables}
   */
  getOutputVariables() {
    return reduce(this._config.output, (acc, output) => {
      const { variables = {} } = output;
      return { ...acc, ...filter(variables, isVariable) };
    }, {});
  }

  _getDefaultInputConfig() {
    return '{}';
  }
}