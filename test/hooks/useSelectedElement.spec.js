import { renderHook, act } from '@testing-library/react';

import { bootstrapModeler, inject } from '../helpers/modeler';

import {
  useSelectedElement
} from '../../lib/hooks/useSelectedElement';

import diagramXML from '../fixtures/ElementConfig.bpmn';

describe('useSelectedElement', function() {

  beforeEach(bootstrapModeler(diagramXML));

  it('should return null and a message if no element is selected', inject(function(injector) {
    const { result } = renderHook(() => useSelectedElement(injector));
    const [ selectedElement, selectionInfo ] = result.current;

    // then
    expect(selectedElement).to.be.null;
    expect(selectionInfo).to.deep.equal({
      message: 'Select a task or subprocess to start testing.'
    });
  }));


  it('should return null and a message if multiple elements are selected', inject(function(elementRegistry, injector, selection) {

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

    const [ selectedElement, selectionInfo ] = result.current;

    // then
    expect(selectedElement).to.be.null;
    expect(selectionInfo).to.deep.equal({
      message: 'Select a task or subprocess to start testing.'
    });
  }));


  it('should return null and a titled message if unsupported element is selected', inject(function(elementRegistry, injector, selection) {

    // given
    const { result } = renderHook(() => useSelectedElement(injector));

    const element = elementRegistry.get('StartEvent_1');

    // when
    act(() => {
      selection.select(element);
    });

    const [ selectedElement, selectionInfo ] = result.current;

    // then
    expect(selectedElement).to.be.null;
    expect(selectionInfo).to.deep.equal({
      title: 'Unsupported element',
      message: 'Task testing is only supported for tasks and subprocesses. Select one to start testing.'
    });
  }));


  it('should return element if supported element is selected', inject(function(elementRegistry, injector, selection) {

    // given
    const { result } = renderHook(() => useSelectedElement(injector));

    const element = elementRegistry.get('ServiceTask_1');

    // when
    act(() => {
      selection.select(element);
    });

    const [ selectedElement, selectionInfo ] = result.current;

    // then
    expect(selectedElement).to.exist;
    expect(selectionInfo).to.be.null;
  }));


  it('should return element if ad-hoc child task is selected', inject(function(elementRegistry, injector, selection) {

    // given
    const { result } = renderHook(() => useSelectedElement(injector));

    const element = elementRegistry.get('AdHocChild_1');

    // when
    act(() => {
      selection.select(element);
    });

    const [ selectedElement, selectionInfo ] = result.current;

    // then
    expect(selectedElement).to.exist;
    expect(selectionInfo).to.be.null;
  }));
});
