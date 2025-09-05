import React from 'react';

import { render } from '@testing-library/react';

import { bootstrapModeler, getModeler } from '../../util/Util';

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

});

function renderWithProps(props) {
  const modeler = getModeler();

  const elementRegistry = modeler.get('elementRegistry');

  const {
    element = elementRegistry.get('ServiceTask_1'),
    input = '{}',
    setInput = () => {},
    reset = () => {},
    variablesForElement,
    output,
    onRunTask = () => {}
  } = props;

  return render(
    <Input
      element={ element }
      input={ input }
      setInput={ setInput }
      reset={ reset }
      variablesForElement={ variablesForElement }
      output={ output }
      onRunTask={ onRunTask }
    />
  );
}
