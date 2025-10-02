import EventEmitter from 'events';

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

    this._variables[element.id] = variables;

    return variables;
  }
}