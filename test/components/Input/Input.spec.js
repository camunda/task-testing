import React from 'react';

import { render } from '@testing-library/react';

import { bootstrapModeler, getModeler } from '../../helpers/modeler';

import Input from '../../../lib/components/Input/Input';

import diagramXML from '../../fixtures/diagram.bpmn';

describe('Input', function() {

  beforeEach(bootstrapModeler(diagramXML));


  it('should render', function() {

    // given
    const input = '{\n  "foo": "bar",\n  "baz": 1337\n}';

    // when
    const { container } = renderWithProps({
      input
    });

    // then
    expect(container.textContent).to.match(/"foo": "bar"/i);
    expect(container.textContent).to.match(/"baz": 1337/i);
  });


  it('should render prefill sources in footer', function() {

    // when
    const { container } = renderWithProps({
      prefillSources: [ 'Task A', 'Task B' ]
    });

    // then
    expect(container.textContent).to.match(/Prefilled from Task A, Task B/);
  });


  it('should render fallback footer when no prefill sources', function() {

    // when
    const { container } = renderWithProps({
      prefillSources: []
    });

    // then
    expect(container.textContent).to.match(/Prefilled from process variables in scope\./);
  });

});

function renderWithProps(props) {
  const modeler = getModeler();

  const elementRegistry = modeler.get('elementRegistry');

  const {
    element = elementRegistry.get('ServiceTask_1'),
    input = '{}',
    onSetInput = () => {},
    onResetInput = () => {},
    onErrorChange = () => {},
    prefillSources,
    variablesForElement,
    output,
    onRunTask = () => {}
  } = props;

  return render(
    <Input
      element={ element }
      input={ input }
      onSetInput={ onSetInput }
      onResetInput={ onResetInput }
      onErrorChange={ onErrorChange }
      prefillSources={ prefillSources }
      variablesForElement={ variablesForElement }
      output={ output }
      onRunTask={ onRunTask }
    />
  );
}
