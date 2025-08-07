import React from 'react';
import { render } from '@testing-library/react';

import InputEditor from '../lib/components/Input/InputEditor';

describe('InputEditor', function() {

  let mockOnChange;
  let mockOnErrorChange;

  beforeEach(function() {
    mockOnChange = sinon.spy();
    mockOnErrorChange = sinon.spy();
  });

  describe('render', function() {

    it('should render with no value and show placeholder', function() {

      // when
      const { queryByText } = render(
        <InputEditor
          onChange={ mockOnChange }
          onErrorChange={ mockOnErrorChange }
        />
      );

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
      const { queryByText } = render(
        <InputEditor
          value={ JSON.stringify(initialValue, null, 2) }
          onChange={ mockOnChange }
          onErrorChange={ mockOnErrorChange }
        />
      );

      // then
      expect(queryByText('"bar"')).to.exist;
      expect(queryByText('true')).to.exist;
      expect(queryByText('42')).to.exist;
    });

  });

  describe('autocompletion', function() {

    it('should', function() {

      // when
      render(
        <InputEditor
          value=""
          onChange={ mockOnChange }
          onErrorChange={ mockOnErrorChange }
        />
      );

      // then - should not throw error and render successfully
      expect(document.querySelector('.input-editor')).to.exist;
    });

  });
});