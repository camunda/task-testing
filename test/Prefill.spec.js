import { bootstrapModeler, inject } from './util/Util';

import { ElementConfig } from '../lib/ElementConfig';
import { ElementVariables } from '../lib/ElementVariables';

import diagramXML from './fixtures/prefill.bpmn';

describe('Prefill', function() {

  beforeEach(bootstrapModeler(diagramXML));

  let elementConfig;
  let elementVariables;

  beforeEach(inject(function(injector) {
    elementVariables = new ElementVariables(injector);
    elementConfig = new ElementConfig(injector, elementVariables);
  }));


  describe('#getDefaultInputForElement', function() {

    it('should compute input stubs from expression requirements',
      inject(async function(elementRegistry) {

        // given
        const element = elementRegistry.get('firstTask');

        // when
        const result = await elementConfig.getDefaultInputForElement(element);
        const parsed = JSON.parse(result);

        // then
        expect(parsed).to.have.property('a', null);
        expect(parsed).to.have.property('b', null);
        expect(parsed).to.not.have.property('firstResult');
      })
    );


    it('should only include requirements for the given element',
      inject(async function(elementRegistry) {

        // given
        const element = elementRegistry.get('secondTask');

        // when
        const result = await elementConfig.getDefaultInputForElement(element);
        const parsed = JSON.parse(result);

        // then
        expect(parsed).to.have.property('d', null);
        expect(parsed).to.have.property('f', null);
        expect(parsed).to.not.have.property('a');
        expect(parsed).to.not.have.property('firstResult');
        expect(parsed).to.not.have.property('secondResult');
      })
    );


    it('should always compute fresh result ignoring stored config',
      inject(async function(elementRegistry) {

        // given
        const element = elementRegistry.get('firstTask');

        elementConfig.setInputConfigForElement(element, '{"custom": 42}');

        // when
        const result = await elementConfig.getDefaultInputForElement(element);
        const parsed = JSON.parse(result);

        // then — stored config is ignored, requirements are used
        expect(parsed).to.have.property('a', null);
        expect(parsed).to.have.property('b', null);
        expect(parsed).to.not.have.property('custom');
      })
    );


    it('should throw for unsupported element types',
      inject(async function(elementRegistry) {

        // given
        const element = elementRegistry.get('Process_prefill');

        // when
        try {
          await elementConfig.getDefaultInputForElement(element);
          expect.fail('should have thrown');
        } catch (error) {

          // then
          expect(error.message).to.match(/Unsupported element type/);
        }
      })
    );

  });


  describe('#getMergedInputConfigForElement', function() {

    it('should merge user values with fresh requirements',
      inject(async function(elementRegistry) {

        // given
        const element = elementRegistry.get('firstTask');

        elementConfig.setInputConfigForElement(element, '{"a": 42}');

        // when
        const merged = await elementConfig.getMergedInputConfigForElement(element);
        const parsed = JSON.parse(merged);

        // then — user value preserved, missing requirement added as null
        expect(parsed).to.have.property('a', 42);
        expect(parsed).to.have.property('b', null);
      })
    );


    it('should strip unfilled null stubs from user input before merging',
      inject(async function(elementRegistry) {

        // given
        const element = elementRegistry.get('firstTask');

        elementConfig.setInputConfigForElement(element, '{"a": null, "b": 99}');

        // when
        const merged = await elementConfig.getMergedInputConfigForElement(element);
        const parsed = JSON.parse(merged);

        // then — null stub for "a" was cleaned, fresh stub re-added
        expect(parsed).to.have.property('a', null);
        expect(parsed).to.have.property('b', 99);
      })
    );


    it('should return null when current input is invalid JSON',
      inject(async function(elementRegistry) {

        // given
        const element = elementRegistry.get('firstTask');

        elementConfig.setInputConfigForElement(element, '{ invalid json }');

        // when
        const merged = await elementConfig.getMergedInputConfigForElement(element);

        // then
        expect(merged).to.be.null;
      })
    );

  });

});
