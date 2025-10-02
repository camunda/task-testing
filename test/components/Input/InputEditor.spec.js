import React from 'react';

import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { bootstrapModeler, getModeler, inject } from '../../util/Util';

import InputEditor, { PLACEHOLDER_TEXT, INVALID_JSON_ERROR } from '../../../lib/components/Input/InputEditor';

import diagramXML from '../../fixtures/InputEditor.bpmn';

describe('InputEditor', function() {

  beforeEach(bootstrapModeler(diagramXML));

  const user = userEvent.setup();


  it('should render with no value and show placeholder', function() {

    // when
    const { queryByText } = renderWithProps();

    // then
    expect(queryByText(PLACEHOLDER_TEXT)).to.exist;
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
        expect(container.querySelector('.cm-completionLabel').textContent).to.eql('foo');
        expect(container.querySelector('.cm-completionInfo').textContent).to.eql('Process variable');
      });
    }));


    it('should show for output variables', async function() {

      // given
      const allOutputs = {
        'ServiceTask_1': {
          variables: {
            foo: '1',
            bar: '2'
          }
        },
        'ServiceTask_2': {
          variables: {
            foo: '3'
          }
        }
      };

      const { container, getByRole } = renderWithProps({
        value: '{}',
        allOutputs
      });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}');

      // then
      await waitFor(() => {
        const completionLabels = Array.from(container.querySelectorAll('.cm-completionLabel')).map(el => el.textContent);

        expect(completionLabels.length).to.eql(3);

        expect(completionLabels[0]).to.eql('bar');
        expect(completionLabels[1]).to.eql('foo');
        expect(completionLabels[2]).to.eql('foo');

        const completionInfos = Array.from(container.querySelectorAll('.cm-completionInfo .info span')).map(el => el.textContent);

        expect(completionInfos.length).to.eql(1);

        expect(completionInfos[0]).to.eql('Output variable from ServiceTask_1');
      });
    });


    it('should show filtered results when typing', inject(async function(elementRegistry, injector) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const variablesForElement = await getVariablesForElement(injector, element);

      const { container, getByRole } = renderWithProps({ value: '{}', variablesForElement });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}f');

      // expect
      await waitFor(() => {
        expect(container.querySelector('.cm-completionLabel').textContent).to.eql('foo');
        expect(container.querySelector('.cm-completionMatchedText').textContent).to.eql('f');
        expect(container.querySelector('.cm-completionInfo').textContent).to.eql('Process variable');
      });
    }));


    it('should show when typing in quotes', inject(async function(elementRegistry, injector) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const variablesForElement = await getVariablesForElement(injector, element);

      const { container, getByRole } = renderWithProps({ value: '{}', variablesForElement });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}"f');

      // expect
      await waitFor(() => {
        expect(container.querySelector('.cm-completionLabel').textContent).to.eql('foo');
        expect(container.querySelector('.cm-completionMatchedText').textContent).to.eql('f');
        expect(container.querySelector('.cm-completionInfo').textContent).to.eql('Process variable');
      });
    }));


    it('should add property to empty line', inject(async function(elementRegistry, injector) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const variablesForElement = await getVariablesForElement(injector, element);

      const onChangeSpy = sinon.spy();

      const { findByRole, getByRole } = renderWithProps({ value: '{}', variablesForElement, onChange: onChangeSpy });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}');

      // Traversing the autocompletion list with keyboard doesn't seem to work,
      // so we click on the option directly.
      const option = await findByRole('option');
      await user.click(option);

      // expect
      expect(onChangeSpy).to.have.been.calledTwice;
      expect(onChangeSpy.getCalls()[0]).to.have.been.calledWith('{\n  \n}');
      expect(onChangeSpy.getCalls()[1]).to.have.been.calledWith('{\n  "foo": \n}');
    }));

  });


  describe('linting', function() {

    it('should call onErrorChange with error message when invalid', async function() {

      // given
      const onErrorChange = sinon.spy();

      // when
      renderWithProps({
        value: '{',
        onErrorChange
      });

      // then
      await waitFor(() => {
        expect(onErrorChange).to.have.been.calledWith(INVALID_JSON_ERROR);
      });
    });


    it('should call onErrorChange with null after when valid', async function() {

      // given
      const onErrorChange = sinon.spy();

      // when
      const { rerender } = renderWithProps({
        value: '{',
        onErrorChange
      });

      // assume
      await waitFor(() => {
        expect(onErrorChange).to.have.been.calledWith(INVALID_JSON_ERROR);
      });

      // when
      rerender(
        <InputEditor
          value={ '{}' }
          onErrorChange={ onErrorChange }
        />
      );

      // then
      await waitFor(() => {
        expect(onErrorChange).to.have.been.calledWith(null);
      });
    });

  });

});

function renderWithProps(props = {}) {
  const modeler = getModeler();

  const elementRegistry = modeler.get('elementRegistry');

  const {
    allOutputs = {},
    element = elementRegistry.get('ServiceTask_1'),
    value,
    onChange = () => {},
    onErrorChange = () => {},
    variablesForElement
  } = props;

  return render(
    <InputEditor
      allOutputs={ allOutputs }
      element={ element }
      value={ value }
      onChange={ onChange }
      onErrorChange={ onErrorChange }
      variablesForElement={ variablesForElement }
    />
  );
}

async function getVariablesForElement(injector, element) {
  const variableResolver = injector.get('variableResolver');

  return variableResolver.getVariablesForElement(element)
    .catch(() => {
      return [];
    });
}