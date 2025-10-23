import React from 'react';

import { render } from '@testing-library/react';

import Output, { pickVariables } from '../../../lib/components/Output/Output';

import { SCOPES } from '../../../lib/TaskExecution';

describe('Output', function() {

  it('should render', async function() {

    // given
    /** @type {import('../../../lib/types').ElementOutput} */
    const output = {
      success: true,
      variables: {
        foo: {
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


  describe('pickVariables', function() {

    it('should pick variables by scope', function() {

      // given
      const variables = {
        var1: { value: 'foo', scope: SCOPES.PROCESS },
        var2: { value: 'bar', scope: SCOPES.LOCAL },
        var3: { value: 'baz', scope: SCOPES.PROCESS }
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
    it('should not pick variables if legacy format', function() {

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

  });

});

function renderWithProps(props) {
  const {
    isConnectionConfigured = true,
    configureConnectionBannerTitle = 'Configure Connection',
    configureConnectionBannerDescription = 'Please configure your connection settings.',
    configureConnectionLabel = 'Configure Connection',
    onConfigureConnection = () => {},
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
