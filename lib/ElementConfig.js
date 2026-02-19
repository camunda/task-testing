import EventEmitter from 'events';

import { isAny } from 'bpmn-js/lib/util/ModelUtil';

import { isString, omit } from 'min-dash';

import {
  DEFAULT_INPUT_CONFIG,
  computeDefaultInput,
  computeMergedInput
} from './utils/prefill';

export { DEFAULT_INPUT_CONFIG };

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

  }

  setConfig(newConfig) {
    this._config = newConfig;

    this.emit('config.changed');
  }

  getConfig() {
    return this._config;
  }

  setInputConfigForElement(element, newConfig) {
    this._assertSupportedElement(element);

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
    this._assertSupportedElement(element);

    this._config = {
      ...this._config,
      input: omit(this._config.input, element.id)
    };

    this.emit('config.changed');
  }

  setOutputConfigForElement(element, newConfig) {
    this._assertSupportedElement(element);

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
    this._assertSupportedElement(element);

    this._config = {
      ...this._config,
      output: omit(this._config.output, element.id)
    };

    this.emit('config.changed');
  }

  getInputConfigForElement(element) {
    this._assertSupportedElement(element);

    if (!isString(this._config.input[element.id])) {
      return DEFAULT_INPUT_CONFIG;
    }

    return this._config.input[element.id];
  }

  /**
   * Computes a fresh input config from the element's input requirements,
   * ignoring any stored user config. Used for resetting input to defaults.
   *
   * @param {Object} element
   * @returns {Promise<string>} JSON string
   */
  async getDefaultInputForElement(element) {
    this._assertSupportedElement(element);

    return computeDefaultInput(this._elementVariables, element);
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
    this._assertSupportedElement(element);

    return computeMergedInput(
      this._config.input[element.id],
      this._elementVariables,
      element
    );
  }

  /**
   * @param {import('./types').Element} element
   * @returns {import('./types').ElementOutput}
   */
  getOutputConfigForElement(element) {
    this._assertSupportedElement(element);

    if (!this._config.output[element.id]) {
      return DEFAULT_OUTPUT;
    }

    return this._config.output[element.id];
  }

  /**
   * @param {Object} element
   * @throws {Error} if the element type is not supported
   */
  _assertSupportedElement(element) {
    if (!isAny(element, SUPPORTED_ELEMENT_TYPES)) {
      throw new Error(`Unsupported element type: ${element.type}`);
    }
  }
}
