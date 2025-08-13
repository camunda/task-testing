import React from 'react';

import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ZeebeVariableResolver from '@bpmn-io/variable-resolver/lib/zeebe/VariableResolver';

import { bootstrapModeler, getModeler, inject } from './util/Util';

import InputEditor from '../lib/components/Input/InputEditor';

import diagramXML from './fixtures/diagram.bpmn';

describe('InputEditor', function() {

  beforeEach(bootstrapModeler(diagramXML));

  const user = userEvent.setup();


  it('should render with no value and show placeholder', function() {

    // when
    const { queryByText } = renderWithProps();

    // then
    expect(queryByText('Provide process variables in JSON format')).to.exist;
  });


  it('should render and show initial value', function() {

    // given
    const initialValue = {
      foo: 'bar',
      baz: 1337
    };

    // when
    const { container } = renderWithProps({
      value: JSON.stringify(initialValue, null, 2)
    });

    // then
    expect(container.textContent).to.match(/"foo": "bar"/i);
    expect(container.textContent).to.match(/"baz": 1337/i);
  });


  describe('autocompletion', function() {

    it('should show for resolved variables', inject(async function(elementRegistry, injector) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const variablesForElement = await getVariablesForElement(injector, element);

      const { container, getByRole } = renderWithProps({
        value: '{}',
        variablesForElement
      });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}');

      // then
      await waitFor(() => {
        expect(container.querySelector('.cm-completionLabel').textContent).to.eql('bazOutput');
        expect(container.querySelector('.cm-completionInfo').textContent).to.eql('From process variables');
      });
    }));


    it('should show for output variables', async function() {

      // given
      const output = {
        variables: {
          foo: { value: 'bar', type: 'String' }
        }
      };

      const { container, getByRole } = renderWithProps({
        value: '{}',
        output
      });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}');

      // then
      await waitFor(() => {
        expect(container.querySelector('.cm-completionLabel').textContent).to.eql('foo');
        expect(container.querySelector('.cm-completionInfo').textContent).to.contain('From output variables');
      });
    });


    it('should show filtered results when typing', inject(async function(elementRegistry, injector) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const variablesForElement = await getVariablesForElement(injector, element);

      const { container, getByRole } = renderWithProps({ value: '{}', variablesForElement });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}b');

      // expect
      await waitFor(() => {
        expect(container.querySelector('.cm-completionLabel').textContent).to.eql('bazOutput');
        expect(container.querySelector('.cm-completionInfo').textContent).to.eql('From process variables');
      });
    }));


    it('should show when typing in quotes', inject(async function(elementRegistry, injector) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const variablesForElement = await getVariablesForElement(injector, element);

      const { container, getByRole } = renderWithProps({ value: '{}', variablesForElement });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}"b');

      // expect
      await waitFor(() => {
        expect(container.querySelector('.cm-completionLabel').textContent).to.eql('bazOutput');
        expect(container.querySelector('.cm-completionInfo').textContent).to.eql('From process variables');
      });
    }));


    it('should add property to empty line', inject(async function(elementRegistry, injector) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const variablesForElement = await getVariablesForElement(injector, element);

      const { container, findByRole, getByRole } = renderWithProps({ value: '{}', variablesForElement });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}');

      // Traversing the autocompletion list with keyboard doesn't seem to work,
      // so we click on the option directly.
      const option = await findByRole('option');
      await user.click(option);

      // expect
      const lineText = container.querySelector('.cm-activeLine').textContent;
      expect(lineText).to.eql('  "bazOutput": ""');
    }));

  });


  describe('linting', function() {

    it('should call onHasErrorChange with true when invalid', async function() {

      // given
      const onHasErrorChange = sinon.spy();

      // when
      renderWithProps({
        value: '{',
        onHasErrorChange
      });

      // then
      await waitFor(() => {
        expect(onHasErrorChange).to.have.been.calledWith(true);
      });
    });


    it('should call onHasErrorChange with false after when valid', async function() {

      // given
      const onHasErrorChange = sinon.spy();

      // when
      const { rerender } = renderWithProps({
        value: '{',
        onHasErrorChange
      });

      // assume
      await waitFor(() => {
        expect(onHasErrorChange).to.have.been.calledWith(true);
      });

      // when
      rerender(
        <InputEditor
          value={ '{}' }
          onHasErrorChange={ onHasErrorChange }
        />
      );

      // then
      await waitFor(() => {
        expect(onHasErrorChange).to.have.been.calledWith(false);
      });
    });

  });

});

function renderWithProps(props = {}) {
  const modeler = getModeler();

  const elementRegistry = modeler.get('elementRegistry');

  const {
    element = elementRegistry.get('ServiceTask_1'),
    value,
    onChange = () => {},
    onHasErrorChange = () => {},
    output,
    variablesForElement
  } = props;

  return render(
    <InputEditor
      element={ element }
      value={ value }
      onChange={ onChange }
      onHasErrorChange={ onHasErrorChange }
      output={ output }
      variablesForElement={ variablesForElement }
    />
  );
}

async function getVariablesForElement(injector, element) {
  const bpmnjs = injector.get('bpmnjs'),
        eventBus = injector.get('eventBus');

  const variableResolver = new ZeebeVariableResolver(eventBus, bpmnjs);

  return variableResolver.getVariablesForElement(element)
    .catch(() => {
      return [];
    });
}