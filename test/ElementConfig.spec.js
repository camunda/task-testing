import sinon from 'sinon';

import { bootstrapModeler, inject } from './util/Util';

import { ElementConfig } from '../lib/ElementConfig';
import { ElementVariables } from '../lib/ElementVariables';

import diagramXML from './fixtures/ElementConfig.bpmn';

const DEFAULT_CONFIG = {
  input: {
    'ServiceTask_1': '{"foo": "bar"}'
  },
  output: {}
};

describe('ElementConfig', function() {

  beforeEach(bootstrapModeler(diagramXML));

  let elementVariables;

  beforeEach(inject(function(injector) {
    elementVariables = new ElementVariables(injector, elementVariables);
  }));


  it('initial config', inject(function(elementRegistry, injector) {

    // given
    const element = elementRegistry.get('ServiceTask_1');

    // when
    const elementConfig = new ElementConfig(injector, elementVariables, DEFAULT_CONFIG);

    // then
    const inputConfigForElement = elementConfig.getInputConfigForElement(element);

    expect(inputConfigForElement).to.eql('{"foo": "bar"}');
  }));


  describe('#setConfig*', function() {

    let elementConfig;

    beforeEach(inject(function(injector) {
      elementConfig = new ElementConfig(injector, elementVariables, DEFAULT_CONFIG);
    }));


    it('should set config', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const spy = sinon.spy();

      elementConfig.on('config.changed', spy);

      // when
      elementConfig.setConfig({
        ...DEFAULT_CONFIG,
        input: {
          ...DEFAULT_CONFIG.input,
          'ServiceTask_1': '{"foo": "baz"}'
        }
      });

      // then
      const inputConfigForElement = elementConfig.getInputConfigForElement(element);

      expect(inputConfigForElement).to.eql('{"foo": "baz"}');

      expect(spy).to.have.been.calledOnce;
    }));


    it('should set input config for element', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const spy = sinon.spy();

      elementConfig.on('config.changed', spy);

      // when
      elementConfig.setInputConfigForElement(element, '{"foo": "baz"}');

      // then
      const inputConfigForElement = elementConfig.getInputConfigForElement(element);

      expect(inputConfigForElement).to.eql('{"foo": "baz"}');

      expect(spy).to.have.been.calledOnce;
    }));


    it('should reset input config for element', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const spy = sinon.spy();

      elementConfig.on('config.changed', spy);

      // when
      elementConfig.resetInputConfigForElement(element);

      // then
      const inputConfigForElement = elementConfig.getInputConfigForElement(element);

      expect(inputConfigForElement).to.eql('{}');

      expect(spy).to.have.been.calledOnce;
    }));


    it('should not set input config and throw error for unsupported element type', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('Process_1');

      // when
      expect(() => {
        elementConfig.setInputConfigForElement(element, '{"foo": "baz"}');
      }).to.throw('Unsupported element type: bpmn:Process');
    }));


    it('should set output config for element', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const spy = sinon.spy();

      elementConfig.on('config.changed', spy);

      // when
      elementConfig.setOutputConfigForElement(element, { result: 'success' });

      // then
      const outputConfigForElement = elementConfig.getOutputConfigForElement(element);

      expect(outputConfigForElement).to.eql({ result: 'success' });

      expect(spy).to.have.been.calledOnce;
    }));


    it('should not set output config and throw error for unsupported element type', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('Process_1');

      // when
      expect(() => {
        elementConfig.setOutputConfigForElement(element, { result: 'success' });
      }).to.throw('Unsupported element type: bpmn:Process');
    }));

  });

  describe('#getInputConfigForElement', function() {

    let elementConfig;

    beforeEach(inject(function(injector) {
      elementConfig = new ElementConfig(injector, elementVariables, DEFAULT_CONFIG);
    }));


    it('should return input config for element', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      // when
      const inputConfigForElement = elementConfig.getInputConfigForElement(element);

      // then
      expect(inputConfigForElement).to.eql('{"foo": "bar"}');
    }));


    it('should return default input config for element', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('ServiceTask_2');

      // when
      const inputConfigForElement = elementConfig.getInputConfigForElement(element);

      // then
      expect(inputConfigForElement).to.eql('{}');
    }));

  });

});