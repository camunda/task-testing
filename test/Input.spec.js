import React from 'react';

import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Input from '../lib/components/Input/Input';

describe('Input', function() {

  const user = userEvent.setup();

  it('should render', function() {

    // given
    const input = '{\n  "variable1": "value1",\n  "variable2": 42\n}';

    // when
    const { getByText } = renderWithProps({
      input
    });

    // then
    expect(getByText('Test Task_1')).to.exist;
    expect(getByText('"value1"')).to.exist;
    expect(getByText('42')).to.exist;
  });


  describe('autocompletion', function() {

    const resolvedVariables = [
      { name: 'foo', detail: 'string', info: 'foo' },
      { name: 'bar', detail: 'number', info: 123 }
    ];

    const outputVariables = {
      'out': { value: 'result', source: 'task1' },
      'put': { value: true, source: 'task2' }
    };

    it('should show for resolved variables', async function() {

      // given
      const { getByText, getByRole } = renderWithProps({ resolvedVariables });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}');

      // then
      await waitFor(() => {
        expect(getByText('foo')).to.exist;
        expect(getByText('bar')).to.exist;
      });

    });


    it('should show for output variables', async function() {

      // given
      const { getByText, getByRole } = renderWithProps({ outputVariables });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}');

      // then
      await waitFor(() => {
        expect(getByText('out')).to.exist;
        expect(getByText('put')).to.exist;
      });

    });


    it('should show filtered results when typing', async function() {

      // given
      const { getByText, getByRole, queryByText } = renderWithProps({ resolvedVariables });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}f');

      // expect
      await waitFor(() => {
        expect(getByText('foo')).to.exist;
        expect(queryByText('bar')).not.to.exist;
      });

    });


    it('should show when typing in quotes', async function() {

      // given
      const { getByText, getByRole } = renderWithProps({ resolvedVariables });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}"f');

      // expect
      await waitFor(() => {
        expect(getByText('foo')).to.exist;
      });

    });


    it('should not show at the end of a line', async function() {

      // given
      const { getByRole, queryByRole } = renderWithProps({
        resolvedVariables,
        input: '{\n  "foo": "bar"\n}'
      });

      // when
      const textbox = getByRole('textbox');
      await user.click(textbox);
      await user.keyboard('{ArrowDown}{End} f');

      // expect
      expect(queryByRole('option')).not.to.exist;
    });


    it('should add property to empty line', async function() {

      // given
      const {
        container,
        getByRole,
        findByRole
      } = renderWithProps({ resolvedVariables });

      // when
      await user.click(getByRole('textbox'));
      await user.keyboard('{ArrowRight}{Enter}f');

      // Traversing the autocompletion list with keyboard doesn't seem to work,
      // so we click on the option directly.
      const option = await findByRole('option');
      await user.click(option);

      // expect
      const lineText = container.querySelector('.cm-activeLine').textContent;
      expect(lineText).to.eql('  "foo": "foo"');
    });

  });

});

function renderWithProps(props) {

  const defaultProps = {
    element: { id: 'task_1', name: 'Task_1' },
    input: '{}',
    setInput: () => {},
    reset: () => {},
    resolvedVariables: [],
    outputVariables: {},
    onRunTask: () => {},
    ...props
  };

  return render(
    <Input { ...defaultProps } />
  );
}
