import EventEmitter from 'events';

import { is } from 'bpmn-js/lib/util/ModelUtil';

export class ElementVariables extends EventEmitter {
  constructor(injector) {
    super();

    this._injector = injector;
    this._variables = {};
    this._variableResolver = injector.get('variableResolver');

    const eventBus = this._injector.get('eventBus');

    eventBus.on('commandStack.changed', () => {
      this._variables = {};

      this.emit('variables.changed');
    });
  }

  async getVariablesForElement(element) {
    if (this._variables[element.id]) {
      return this._variables[element.id];
    }

    const variables = await this._variableResolver.getVariablesForElement(element)
      .catch(() => {
        return [];
      });

    const processVariables = variables.filter(({ scope }) => is(scope, 'bpmn:Process'));

    this._variables[element.id] = processVariables;

    return processVariables;
  }
}