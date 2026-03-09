import { bootstrapModeler, inject } from '../helpers/modeler';

import {
  getProcessId,
  isInsideAdHocSubProcess
} from '../../lib/utils/element';

import processXML from '../fixtures/diagram.bpmn';
import collaborationXML from '../fixtures/collaboration.bpmn';

describe('element', function() {

  describe('getProcessId', function() {

    describe('process', function() {

      beforeEach(bootstrapModeler(processXML));


      it('should return process ID (process)', inject(function(elementRegistry) {

        // given
        const element = elementRegistry.get('ServiceTask_1');

        // when
        const processId = getProcessId(element);

        // then
        expect(processId).to.equal('Process_1');
      }));

    });


    describe('collaboration', function() {

      beforeEach(bootstrapModeler(collaborationXML));


      it('should return process ID (collaboration)', inject(function(elementRegistry) {

        // given
        const element = elementRegistry.get('ServiceTask_1');

        // when
        const processId = getProcessId(element);

        // then
        expect(processId).to.equal('Process_1');
      }));

    });

  });


  describe('isInsideAdHocSubProcess', function() {

    beforeEach(bootstrapModeler(processXML));


    it('should return true for direct child of ad-hoc subprocess', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('AdHocSubProcessTask');

      // when
      const result = isInsideAdHocSubProcess(element);

      // then
      expect(result).to.be.true;
    }));


    it('should return true for nested child of ad-hoc subprocess', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('CollapsedAdHocSubProcessTask');

      // when
      const result = isInsideAdHocSubProcess(element);

      // then
      expect(result).to.be.true;
    }));


    it('should return false for element not in ad-hoc subprocess', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      // when
      const result = isInsideAdHocSubProcess(element);

      // then
      expect(result).to.be.false;
    }));

  });

});