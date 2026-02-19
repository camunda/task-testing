import React from 'react';

import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { bootstrapModeler, getModeler, inject } from '../../util/Util';

import InputEditor, { PLACEHOLDER_TEXT, INVALID_JSON_ERROR } from '../../../lib/components/Input/InputEditor';

import diagramXML from '../../fixtures/InputEditor.bpmn';

import { SCOPES } from '../../../lib/TaskExecution';

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
            1: {
              name: 'foo',
              value: '1',
              scope: SCOPES.PROCESS
            },
            2: {
              name: 'bar',
              value: '2',
              scope: SCOPES.LOCAL
            },
          }
        },
        'ServiceTask_2': {
          variables: {
            3: {
              name: 'foo',
              value: '3',
              scope: SCOPES.PROCESS
            },
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

        expect(completionLabels.length).to.eql(2);

        expect(completionLabels[0]).to.eql('foo');
        expect(completionLabels[1]).to.eql('foo');

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


    it('should not show in nested property on new line', inject(async function(elementRegistry, injector) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const variablesForElement = await getVariablesForElement(injector, element);

      const { getByRole, findByRole } = renderWithProps({
        value: '{\n"bar": {}\n}',
        variablesForElement
      });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowDown}{End}{ArrowLeft}{Enter}');

      // then
      let thrown = false;

      try {
        await findByRole('option');
      } catch {
        thrown = true;
      }

      expect(thrown).to.be.true;
    }));


    it('should not show in nested property on typing', inject(async function(elementRegistry, injector) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const variablesForElement = await getVariablesForElement(injector, element);

      const { getByRole, findByRole } = renderWithProps({
        value: '{\n"bar": {}\n}',
        variablesForElement
      });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowDown}{End}{ArrowLeft}{Enter}f');

      // then
      let thrown = false;

      try {
        await findByRole('option');
      } catch {
        thrown = true;
      }

      expect(thrown).to.be.true;
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


  describe('undo/redo', function() {

    const isMac = /Mac/.test(navigator.platform);
    const undoKeys = isMac ? '{Meta>}z{/Meta}' : '{Control>}z{/Control}';
    const redoKeys = isMac ? '{Meta>}{Shift>}z{/Shift}{/Meta}' : '{Control>}y{/Control}';


    it('should undo typing', async function() {

      // given
      const onChangeSpy = sinon.spy();

      const { getByRole } = renderWithProps({
        value: '{}',
        onChange: onChangeSpy
      });

      const textbox = getByRole('textbox');
      await user.click(textbox);

      // when - type something
      await user.keyboard('{ArrowRight}{Enter}"a": 1');

      // assume - typing happened
      await waitFor(() => {
        expect(onChangeSpy).to.have.been.called;
      });

      const valueAfterTyping = onChangeSpy.lastCall.args[0];
      expect(valueAfterTyping).to.contain('"a": 1');

      onChangeSpy.resetHistory();

      // when - undo
      await user.keyboard(undoKeys);

      // then - onChange should fire with reverted content
      await waitFor(() => {
        expect(onChangeSpy).to.have.been.called;
      });
    });


    it('should undo reset', async function() {

      // given
      const onChangeSpy = sinon.spy();
      const originalValue = '{\n  "foo": "bar"\n}';
      const resetValue = '{}';

      const { container, getByRole, rerender } = renderWithProps({
        value: originalValue,
        onChange: onChangeSpy
      });

      // assume - editor shows original value
      expect(container.textContent).to.contain('"foo": "bar"');

      // when - simulate reset by changing value prop
      rerender(
        <InputEditor
          value={ resetValue }
          onChange={ onChangeSpy }
          onErrorChange={ () => {} }
        />
      );

      await waitFor(() => {
        expect(container.textContent).to.not.contain('"foo": "bar"');
      });

      // when - undo the reset
      const textbox = getByRole('textbox');
      await user.click(textbox);
      await user.keyboard(undoKeys);

      // then - editor should revert to original value
      await waitFor(() => {
        expect(onChangeSpy).to.have.been.calledWith(originalValue);
      });
    });


    it('should redo after undo', async function() {

      // given
      const onChangeSpy = sinon.spy();
      const originalValue = '{\n  "foo": "bar"\n}';
      const resetValue = '{}';

      const { container, getByRole, rerender } = renderWithProps({
        value: originalValue,
        onChange: onChangeSpy
      });

      // reset
      rerender(
        <InputEditor
          value={ resetValue }
          onChange={ onChangeSpy }
          onErrorChange={ () => {} }
        />
      );

      await waitFor(() => {
        expect(container.textContent).to.not.contain('"foo": "bar"');
      });

      // undo
      const textbox = getByRole('textbox');
      await user.click(textbox);
      await user.keyboard(undoKeys);

      await waitFor(() => {
        expect(onChangeSpy).to.have.been.calledWith(originalValue);
      });

      onChangeSpy.resetHistory();

      // when - redo
      await user.keyboard(redoKeys);

      // then - should go back to reset value
      await waitFor(() => {
        expect(onChangeSpy).to.have.been.calledWith(resetValue);
      });
    });


    it('should not undo the initial fill', async function() {

      // given - editor starts without value, then receives async prefill
      const onChangeSpy = sinon.spy();
      const prefillValue = '{\n  "foo": "bar"\n}';

      const { container, getByRole, rerender } = renderWithProps({
        onChange: onChangeSpy
      });

      // simulate async prefill arriving
      rerender(
        <InputEditor
          value={ prefillValue }
          onChange={ onChangeSpy }
          onErrorChange={ () => {} }
        />
      );

      await waitFor(() => {
        expect(container.textContent).to.contain('"foo": "bar"');
      });

      // when - try to undo the prefill
      const textbox = getByRole('textbox');
      await user.click(textbox);
      await user.keyboard(undoKeys);

      // then - prefill should remain (not undoable)
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(onChangeSpy).to.not.have.been.called;
      expect(container.textContent).to.contain('"foo": "bar"');
    });


    it('should not undo past the initial value', async function() {

      // given - editor starts with value, user types something
      const onChangeSpy = sinon.spy();
      const initialValue = '{\n  "foo": "bar"\n}';

      const { container, getByRole } = renderWithProps({
        value: initialValue,
        onChange: onChangeSpy
      });

      const textbox = getByRole('textbox');
      await user.click(textbox);

      // type something
      await user.keyboard('{ArrowRight}{Enter}"a": 1');

      await waitFor(() => {
        expect(onChangeSpy).to.have.been.called;
      });

      onChangeSpy.resetHistory();

      // when - undo typing
      await user.keyboard(undoKeys);

      await waitFor(() => {
        expect(onChangeSpy).to.have.been.calledWith(initialValue);
      });

      onChangeSpy.resetHistory();

      // when - undo again (should not go to empty)
      await user.keyboard(undoKeys);

      // then - should stay at initial value
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(onChangeSpy).to.not.have.been.called;
      expect(container.textContent).to.contain('"foo": "bar"');
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