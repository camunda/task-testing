import { bootstrapModeler, inject } from './util/Util';

import { ElementConfig } from '../lib/ElementConfig';
import { ElementVariables } from '../lib/ElementVariables';
import ExampleDataVariableProviderModule from '@camunda/example-data-properties-provider/lib/variableProvider';

import diagramXML from './fixtures/prefill.bpmn';

describe('Prefill', function() {

  beforeEach(bootstrapModeler(diagramXML, {
    additionalModules: [ ExampleDataVariableProviderModule ]
  }));

  let elementConfig;
  let elementVariables;

  beforeEach(inject(function(injector) {
    elementVariables = new ElementVariables(injector);
    elementConfig = new ElementConfig(injector, elementVariables);
  }));


  describe('#getPrefilledInputConfigForElement', function() {

    it('should prefill firstTask with example data value and null for unknown',
      inject(async function(elementRegistry) {

        // given
        const element = elementRegistry.get('firstTask');

        // when
        const prefilled = await elementConfig.getPrefilledInputConfigForElement(element);
        const parsed = JSON.parse(prefilled);

        // then
        expect(parsed).to.have.property('a', 42);
        expect(parsed).to.have.property('b', null);
        expect(parsed).to.not.have.property('firstResult');
      })
    );


    it('should prefill secondTask with only its expression inputs',
      inject(async function(elementRegistry) {

        // given
        const element = elementRegistry.get('secondTask');

        // when
        const prefilled = await elementConfig.getPrefilledInputConfigForElement(element);
        const parsed = JSON.parse(prefilled);

        // then
        expect(parsed).to.have.property('d', null);
        expect(parsed).to.have.property('f', null);
        expect(parsed).to.not.have.property('a');
        expect(parsed).to.not.have.property('firstResult');
        expect(parsed).to.not.have.property('secondResult');
      })
    );

  });

});
