import EventEmitter from 'events';

import ZeebeVariableResolver from '@bpmn-io/variable-resolver/lib/zeebe/VariableResolver';

export class ElementVariables extends EventEmitter {
  constructor(injector) {
    super();

    this._injector = injector;
    this._variables = {};

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

    const bpmnjs = this._injector.get('bpmnjs'),
          eventBus = this._injector.get('eventBus');

    if (!this._variableResolver) {
      this._variableResolver = new ZeebeVariableResolver(eventBus, bpmnjs);
    }

    const variables = await this._variableResolver.getVariablesForElement(element)
      .catch(() => {
        return [];
      });

    this._variables[element.id] = variables;

    return variables;
  }
}