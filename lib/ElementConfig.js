/**
 * @import { Config, Element, ElementOutput } from './types'
 */

import EventEmitter from 'events';

import { isAny } from 'bpmn-js/lib/util/ModelUtil';

import { isString, omit } from 'min-dash';

import {
  DEFAULT_INPUT_CONFIG,
  computeDefaultInput,
  computeMergedInput
} from './utils/prefill';

import { SUPPORTED_ELEMENT_TYPES } from './utils/element';

export { DEFAULT_INPUT_CONFIG };

export const DEFAULT_CONFIG = {
  input: {},
  output: {}
};

const DEFAULT_OUTPUT = undefined;

export class ElementConfig extends EventEmitter {
  constructor(injector, elementVariables, config = DEFAULT_CONFIG) {
    super();

    this._injector = injector;
    this._elementVariables = elementVariables;

    /**
     * @type {Config}
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

  async getDefaultInputForElement(element) {
    this._assertSupportedElement(element);

    return computeDefaultInput(this._elementVariables, element);
  }

  /**
   * Merges default input with already existing user edits.
   *
   * Returns null if the input config is unparsable to persist in progress edits
   *
   * @param {Element} element
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
   * @param {Element} element
   * @returns {ElementOutput}
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
