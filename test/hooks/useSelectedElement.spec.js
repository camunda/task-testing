import { renderHook, act } from '@testing-library/react';

import { bootstrapModeler, inject } from '../util/Util';

import {
  useSelectedElement,
  SINGLE_TASK_SELECTION_REQUIRED_MESSAGE,
  TASK_SELECTION_REQUIRED_MESSAGE
} from '../../lib/hooks/useSelectedElement';

import diagramXML from '../fixtures/ElementConfig.bpmn';

describe('useSelectedElement', function() {

  beforeEach(bootstrapModeler(diagramXML));

  it('should return null and a message if no element is selected', inject(
    function(injector) {
      const { result } = renderHook(() => useSelectedElement(injector));
      const [ selectedElement, message ] = result.current;

      // then
      expect(selectedElement).to.be.null;
      expect(message).to.equal(SINGLE_TASK_SELECTION_REQUIRED_MESSAGE);
    }
  ));


  it('should return null and a message if multiple elements are selected', inject(
    function(elementRegistry, injector, selection) {

      // given
      const { result } = renderHook(() => useSelectedElement(injector));

      const elements = [
        elementRegistry.get('StartEvent_1'),
        elementRegistry.get('ServiceTask_1')
      ];

      // when
      act(() => {
        selection.select(elements);
      });

      const [ selectedElement, message ] = result.current;

      // then
      expect(selectedElement).to.be.null;
      expect(message).to.equal(SINGLE_TASK_SELECTION_REQUIRED_MESSAGE);
    }
  ));


  it('should return null and a message if unsupported element is selected', inject(
    function(elementRegistry, injector, selection) {

      // given
      const { result } = renderHook(() => useSelectedElement(injector));

      const element = elementRegistry.get('StartEvent_1');

      // when
      act(() => {
        selection.select(element);
      });

      const [ selectedElement, message ] = result.current;

      // then
      expect(selectedElement).to.be.null;
      expect(message).to.equal(TASK_SELECTION_REQUIRED_MESSAGE);
    }
  ));


  it('should return element if supported element is selected', inject(
    function(elementRegistry, injector, selection) {

      // given
      const { result } = renderHook(() => useSelectedElement(injector));

      const element = elementRegistry.get('ServiceTask_1');

      // when
      act(() => {
        selection.select(element);
      });

      const [ selectedElement, message ] = result.current;

      // then
      expect(selectedElement).to.exist;
      expect(message).to.be.null;
    }
  ));

});
