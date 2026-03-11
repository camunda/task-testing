/**
 * @import {
 *   ElementOutput,
 *   ElementOutputVariables
 * }
 */

import React from 'react';

import { render } from '@testing-library/react';

import Output from '../../../lib/components/Output/Output';

import { SCOPES } from '../../../lib/utils/variables';
import { PluginContext, usePluginsProviderValue } from '../../../lib/components/shared/plugins';
import { pickVariables } from '../../../lib/utils/variables';
import { createIncidentDetails } from '../../helpers/responses';

describe('Output', function() {

  it('should render empty state when no output', async function() {

    // when
    const { queryByText } = renderWithProps({
      output: null
    });

    // then
    expect(queryByText(/Result will appear here after you run the test/i)).to.exist;
    expect(queryByText(/Test completed/i)).to.not.exist;
    expect(queryByText(/Running test/i)).to.not.exist;
  });


  it('should render executing banner', async function() {

    // when
    const { queryByText } = renderWithProps({
      isTaskExecuting: true,
      output: null
    });

    // then
    expect(queryByText(/Running test/i)).to.exist;
    expect(queryByText(/Result will appear here/i)).to.not.exist;
  });


  it('should render success banner', async function() {

    // given
    const output = {
      success: true,
      variables: {}
    };

    // when
    const { queryByText } = renderWithProps({ output });

    // then
    expect(queryByText(/Test completed/i)).to.exist;
  });


  it('should render variables for success output', async function() {

    // given
    /** @type {ElementOutput} */
    const output = {
      success: true,
      variables: {
        1: {
          name: 'foo',
          value: 'bar',
          scope: SCOPES.PROCESS
        },
        2: {
          name: 'localFoo',
          value: 'localBar',
          scope: SCOPES.LOCAL
        }
      }
    };

    // when
    const { getAllByRole, queryByText } = renderWithProps({
      output
    });

    // then
    expect(queryByText(/Process variables/i)).to.exist;
    expect(queryByText(/Local variables/i)).to.exist;

    const textboxes = getAllByRole('textbox');

    const hasMatch = textboxes.some(tb => /"foo": "bar"/i.test(tb.textContent));
    expect(hasMatch).to.be.true;

    const hasLocalMatch = textboxes.some(tb => /"localFoo": "localBar"/i.test(tb.textContent));
    expect(hasLocalMatch).to.be.true;
  });


  it('should render error banner', async function() {

    // given
    const output = {
      success: false,
      error: {
        message: 'Foo',
        response: 'Bar'
      }
    };

    // when
    const { queryByText } = renderWithProps({ output });

    // then
    expect(queryByText(/Error: Foo/i)).to.exist;
  });


  it('should render all error details', async function() {

    // given
    const output = {
      success: false,
      error: {
        message: 'Something went wrong',
        detail: 'The connector timed out',
        errorType: 'HttpSdkError',
        status: 503,
        response: 'Service Unavailable'
      }
    };

    // when
    const { queryByText } = renderWithProps({ output });

    // then
    expect(queryByText('Something went wrong')).to.exist;
    expect(queryByText('The connector timed out')).to.exist;
    expect(queryByText('HttpSdkError')).to.exist;
    expect(queryByText('503')).to.exist;
    expect(queryByText('Service Unavailable')).to.exist;
  });


  it('should render variables for error output', async function() {

    // given
    /** @type {ElementOutput} */
    const output = {
      success: false,
      error: {
        message: 'Foo',
        response: 'Bar'
      },
      variables: {
        1: { name: 'foo', value: 'bar', scope: SCOPES.PROCESS }
      }
    };

    // when
    const { getAllByRole, queryByText } = renderWithProps({
      output
    });

    // then
    expect(queryByText(/Process variables/i)).to.exist;

    const textboxes = getAllByRole('textbox');

    const hasMatch = textboxes.some(tb => /"foo": "bar"/i.test(tb.textContent));
    expect(hasMatch).to.be.true;
  });


  it('should render incident banner', async function() {

    // given
    const output = {
      success: false,
      incident: {
        errorType: 'JOB_NO_RETRIES',
        errorMessage: 'No retries left'
      }
    };

    // when
    const { queryByText } = renderWithProps({ output });

    // then
    expect(queryByText(/Incident: JOB_NO_RETRIES/i)).to.exist;
    expect(queryByText(/No retries left/i)).to.exist;
  });


  it('should render all incident details', async function() {

    // given
    const output = {
      success: false,
      incident: createIncidentDetails({
        errorType: 'JOB_NO_RETRIES',
        errorMessage: 'No retries left'
      })
    };

    // when
    const { queryByText } = renderWithProps({ output });

    // then
    expect(queryByText('Incident details')).to.exist;
    expect(queryByText('JOB_NO_RETRIES')).to.exist;
    expect(queryByText('No retries left')).to.exist;
  });


  it('should render variables for incident output', async function() {

    // given
    /** @type {ElementOutput} */
    const output = {
      success: false,
      incident: {
        errorType: 'JOB_NO_RETRIES',
        errorMessage: 'No retries left'
      },
      variables: {
        1: { name: 'foo', value: 'bar', scope: SCOPES.PROCESS }
      }
    };

    // when
    const { getAllByRole, queryByText } = renderWithProps({
      output
    });

    // then
    expect(queryByText(/Process variables/i)).to.exist;

    const textboxes = getAllByRole('textbox');

    const hasMatch = textboxes.some(tb => /"foo": "bar"/i.test(tb.textContent));
    expect(hasMatch).to.be.true;
  });


  it('should render terminated banner', async function() {

    // given
    const output = {
      success: false,
      terminated: true
    };

    // when
    const { queryByText } = renderWithProps({ output });

    // then
    expect(queryByText(/Process instance terminated/i)).to.exist;
    expect(queryByText(/terminated before the test could complete/i)).to.exist;
  });


  it('should render variables for terminated output', async function() {

    // given
    /** @type {ElementOutput} */
    const output = {
      success: false,
      terminated: true,
      variables: {
        1: {
          name: 'foo',
          value: 'bar',
          scope: SCOPES.PROCESS
        }
      }
    };

    // when
    const { getAllByRole, queryByText } = renderWithProps({
      output
    });

    // then
    expect(queryByText(/Process variables/i)).to.exist;

    const textboxes = getAllByRole('textbox');
    const hasMatch = textboxes.some(tb => /"foo": "bar"/i.test(tb.textContent));
    expect(hasMatch).to.be.true;
  });


  it('should render canceled banner', async function() {

    // given
    const output = {
      success: false,
      canceled: true
    };

    // when
    const { queryByText } = renderWithProps({ output });

    // then
    expect(queryByText(/Test canceled/i)).to.exist;
    expect(queryByText(/manually canceled/i)).to.exist;
  });


  it('should render variables for canceled output', async function() {

    // given
    const output = {
      success: false,
      canceled: true,
      variables: {
        1: {
          name: 'myVar',
          value: 'snapshot',
          scope: SCOPES.PROCESS
        }
      }
    };

    // when
    const { getAllByRole, queryByText } = renderWithProps({ output });

    // then
    expect(queryByText(/Process variables/i)).to.exist;

    const textboxes = getAllByRole('textbox');
    const hasMatch = textboxes.some(tb => /"myVar": "snapshot"/i.test(tb.textContent));
    expect(hasMatch).to.be.true;
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

});

function renderWithProps(props = {}) {
  const {
    element,
    isConnectionConfigured = true,
    currentOperateUrl = null,
    isTaskExecuting = false,
    output = {},
    onResetOutput = () => {},
    taskExecutionState,
    executionLog = [],
    tasklistBaseUrl,
    currentVariables
  } = props;


  return render(
    <Wrapper>
      <Output
        element={ element }
        isConnectionConfigured={ isConnectionConfigured }
        currentOperateUrl={ currentOperateUrl }
        isTaskExecuting={ isTaskExecuting }
        output={ output }
        onResetOutput={ onResetOutput }
        taskExecutionState={ taskExecutionState }
        executionLog={ executionLog }
        tasklistBaseUrl={ tasklistBaseUrl }
        currentVariables={ currentVariables }
      />
    </Wrapper>
  );
}

const Wrapper = (props) => {
  const pluginsProviderValue = usePluginsProviderValue();

  return (
    <PluginContext.Provider value={ pluginsProviderValue }>
      { props.children }
    </PluginContext.Provider>
  );
};