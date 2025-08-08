import React from 'react';

import { render, waitFor } from '@testing-library/react';

import InputEditor from '../lib/components/Input/InputEditor';

describe('InputEditor', function() {

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
      baz: true,
      nested: {
        num: 42,
      }
    };

    // when
    const { queryByText } = renderWithProps({
      value: JSON.stringify(initialValue, null, 2)
    });

    // then
    expect(queryByText('"bar"')).to.exist;
    expect(queryByText('true')).to.exist;
    expect(queryByText('42')).to.exist;
  });


  describe('linting', function() {

    it('should call onErrorChange', async function() {

      // given
      const onErrorChange = sinon.spy();

      // when
      renderWithProps({
        value: 'not a valid JSON',
        onErrorChange
      });

      // then
      await waitFor(() => {
        expect(onErrorChange).to.have.been.calledWith(true);
      });
    });


    it('should call onErrorChange with false after fixed', async function() {

      // given
      const onErrorChange = sinon.spy();

      // when
      const { rerender } = renderWithProps({
        value: 'not a valid JSON',
        onErrorChange
      });

      // assume
      await waitFor(() => {
        expect(onErrorChange).to.have.been.calledWith(true);
      });

      // when
      rerender(
        <InputEditor
          value={ '{"valid": "json"}' }
          onErrorChange={ onErrorChange }
        />
      );

      // then
      await waitFor(() => {
        expect(onErrorChange).to.have.been.calledWith(false);
      });
    });

  });
});

function renderWithProps(props = {}) {
  return render(
    <InputEditor
      value={ props.value || undefined }
      onChange={ props.onChange || (() => {}) }
      onErrorChange={ props.onErrorChange || (() => {}) }
      autocompletion={ props.autocompletion || [] }
    />
  );
}