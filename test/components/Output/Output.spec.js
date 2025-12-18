import React from 'react';

import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Output, { pickVariables, NO_OPERATE_URL_TOOLTIP } from '../../../lib/components/Output/Output';

import { SCOPES } from '../../../lib/TaskExecution';

describe('Output', function() {

  it('should render', async function() {

    // given
    /** @type {import('../../../lib/types').ElementOutput} */
    const output = {
      success: true,
      variables: {
        1: {
          name: 'foo',
          value: 'bar',
          scope: SCOPES.PROCESS
        }
      }
    };

    // when
    const { getByRole, queryByText } = renderWithProps({
      output
    });

    // then
    expect(queryByText(/Process variables/i)).to.exist;
    expect(queryByText(/Local variables/i)).to.exist;
    expect(getByRole('textbox').textContent).to.match(/"foo": "bar"/i);
  });


  describe('error banner', function() {

    it('should render action link when onConfigureConnection is provided', async function() {

      // when
      const { queryByText } = renderWithProps({
        isConnectionConfigured: false,
        configureConnectionBannerTitle: 'Foo',
        configureConnectionBannerDescription: 'Bar',
        configureConnectionLabel: 'Baz',
        onConfigureConnection: () => {}
      });

      // then
      expect(queryByText(/Foo/i)).to.exist;
      expect(queryByText(/Bar/i)).to.exist;
      expect(queryByText(/Baz/i)).to.exist;
    });


    it('should not render action link when onConfigureConnection is not provided', async function() {

      // when
      const { queryByText } = renderWithProps({
        isConnectionConfigured: false,
        configureConnectionBannerTitle: 'Foo',
        configureConnectionBannerDescription: 'Bar',
        configureConnectionLabel: 'Baz'
      });

      // then
      expect(queryByText(/Foo/i)).to.exist;
      expect(queryByText(/Bar/i)).to.exist;
      expect(queryByText(/Baz/i)).to.not.exist;
    });

  });


  describe('pickVariables', function() {

    it('should pick variables by scope', function() {

      // given
      const variables = {
        1: { name: 'var1', value: 'foo', scope: SCOPES.PROCESS },
        2: { name: 'var2', value: 'bar', scope: SCOPES.LOCAL },
        3: { name: 'var3', value: 'baz', scope: SCOPES.PROCESS }
      };

      // when
      const processVariables = pickVariables(variables, SCOPES.PROCESS);
      const localVariables = pickVariables(variables, SCOPES.LOCAL);

      // then
      expect(processVariables).to.eql({
        var1: 'foo',
        var3: 'baz'
      });

      expect(localVariables).to.eql({
        var2: 'bar'
      });
    });


    // see https://github.com/camunda/task-testing/issues/12 for legacy format
    it('should not pick variables if legacy format (no scope)', function() {

      // given
      const variables = {
        var1: 'foo',
        var2: 'bar',
        var3: 'baz'
      };

      // when
      const processVariables = pickVariables(variables, SCOPES.PROCESS);
      const localVariables = pickVariables(variables, SCOPES.LOCAL);

      // then
      expect(processVariables).to.eql({});

      expect(localVariables).to.eql({});
    });

    // see https://github.com/camunda/task-testing/issues/48 for legacy format
    it('should not pick variables if legacy format (no name)', function() {

      // given
      const variables = {
        var1: {
          value: 'foo'
        },
        var2: {
          value: 'bar'
        },
        var3: {
          value: 'baz'
        }
      };

      // when
      const processVariables = pickVariables(variables, SCOPES.PROCESS);
      const localVariables = pickVariables(variables, SCOPES.LOCAL);

      // then
      expect(processVariables).to.eql({});

      expect(localVariables).to.eql({});
    });

  });


  describe('Operate URL', function() {

    it('should show Operate URL when set in output', function() {

      // given
      const output = {
        success: true,
        operateUrl: 'https://camunda.com',
        variables: {}
      };

      // when
      const { queryByText } = renderWithProps({
        output
      });

      // then
      expect(queryByText(/View in Operate/i)).to.exist;
    });


    it('should show Operate URL tooltip when not set in output', function() {

      // given
      const output = {
        success: true,
        variables: {}
      };

      // when
      const { queryByText } = renderWithProps({
        output
      });

      userEvent.hover(queryByText(/View in Operate/i));

      // then
      expect(queryByText(NO_OPERATE_URL_TOOLTIP)).to.exist;
    });

  });

});

function renderWithProps(props) {
  const {
    isConnectionConfigured = true,
    configureConnectionBannerTitle = 'Configure Connection',
    configureConnectionBannerDescription = 'Please configure your connection settings.',
    configureConnectionLabel = 'Configure Connection',
    onConfigureConnection,
    isTaskExecuting = false,
    output = {},
    onResetOutput = () => {},
    taskExecutionStatus = 'FOO'
  } = props;

  return render(
    <Output
      isConnectionConfigured={ isConnectionConfigured }
      configureConnectionBannerTitle={ configureConnectionBannerTitle }
      configureConnectionBannerDescription={ configureConnectionBannerDescription }
      configureConnectionLabel={ configureConnectionLabel }
      onConfigureConnection={ onConfigureConnection }
      isTaskExecuting={ isTaskExecuting }
      output={ output }
      onResetOutput={ onResetOutput }
      taskExecutionStatus={ taskExecutionStatus }
    />
  );
}
