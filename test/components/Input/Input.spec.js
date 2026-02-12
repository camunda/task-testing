import React from 'react';

import { render } from '@testing-library/react';

import { bootstrapModeler } from '../../util/Util';

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
  const {
    allOutputs = {},
    input = '{}',
    onErrorChange = () => {},
    onResetInput = () => {},
    onSetInput = () => {},
    variablesForElement
  } = props;

  return render(
    <Input
      allOutputs={ allOutputs }
      input={ input }
      onErrorChange={ onErrorChange }
      onResetInput={ onResetInput }
      onSetInput={ onSetInput }
      variablesForElement={ variablesForElement }
    />
  );
}
