import { bootstrapModeler, inject } from './util/Util';

import { ElementVariables } from '../lib/ElementVariables';

import diagramXML from './fixtures/ElementVariables.bpmn';

describe('ElementVariables', function() {

  beforeEach(bootstrapModeler(diagramXML));

  it('should resolve variables',
    inject(async function(elementRegistry, injector) {

      // given
      const elementVariables = new ElementVariables(injector);
      const element = elementRegistry.get('ServiceTask_1');

      // when
      const variables = await elementVariables.getVariablesForElement(element);

      // then
      expect(variables).to.have.length(3);
      expect(variables.map(v => v.name)).to.include.members([
        'StartEvent_Output',
        'SubprocessEvent_Output',
        'Subprocess_Output',
      ]);
    })
  );


  it('should resolve variables in subprocess',
    inject(async function(elementRegistry, injector) {

      // given
      const elementVariables = new ElementVariables(injector);
      const element = elementRegistry.get('ServiceTask_2');

      // when
      const variables = await elementVariables.getVariablesForElement(element);

      // then
      expect(variables).to.have.length(5);
      expect(variables.map(v => v.name)).to.include.members([
        'StartEvent_Output',
        'ServiceTask1_Output',
        'Subprocess_Output',
        'Subprocess_Input',
        'SubprocessEvent_Output'
      ]);
    })
  );


  it('should resolve local variable with multiple origins',
    inject(async function(elementRegistry, injector) {

      // given
      const elementVariables = new ElementVariables(injector);
      const element = elementRegistry.get('ServiceTask_2');

      // when
      const variables = await elementVariables.getVariablesForElement(element);

      // then
      expect(variables).to.have.length(5);
      expect(variables.map(v => v.name)).to.include('SubprocessEvent_Output');
    })
  );
});