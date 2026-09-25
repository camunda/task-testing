/**
 * @import {
 *   ElementOutput,
 *   ElementOutputVariables
 * }
 */

import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { TooltipProvider } from '@camunda/design-system';

import Output, { getWaitingContext } from '../../../lib/components/Output/Output';

import {
  createJobEntry,
  EXECUTION_LOG_ENTRY_STATUS,
  EXECUTION_LOG_ENTRY_TYPE
} from '../../../lib/ExecutionLog';

import { SCOPES } from '../../../lib/utils/variables';
import { PluginContext, usePluginsProviderValue } from '../../../lib/components/shared/plugins';
import { pickVariables } from '../../../lib/utils/variables';
import {
  createIncidentDetails,
  createJobDetails,
  createMockTimestamp
} from '../../helpers/responses';

describe('Output', function() {

  it('should render idle placeholder when no output', async function() {

    // when
    const { queryByText } = renderWithProps({
      output: null
    });

    // then
    expect(queryByText(/No run yet\. Results appear here\./i)).to.exist;
    expect(queryByText(/Test completed/i)).to.not.exist;
    expect(queryByText(/Running test/i)).to.not.exist;
  });


  it('should render input error placeholder', async function() {

    // when
    const { queryByText } = renderWithProps({
      output: null,
      inputError: 'Invalid JSON'
    });

    // then
    expect(queryByText(/Fix the input to run a test\./i)).to.exist;
  });


  it('should render connection error card when no connection configured', async function() {

    // given
    const onConfigureSpy = sinon.spy();

    // when
    const { getByText, queryByText } = renderWithProps({
      output: null,
      isConnectionConfigured: false,
      errorBannerTitle: 'Connection error',
      onConfigure: onConfigureSpy
    });

    // then
    expect(queryByText('Connection error')).to.exist;
    expect(queryByText(/Connect a Camunda 8 cluster/i)).to.exist;

    const configureButton = getByText('Configure connection');

    configureButton.click();

    expect(onConfigureSpy).to.have.been.calledOnce;
  });


  it('should render executing card', async function() {

    // when
    const { queryByText } = renderWithProps({
      isTaskExecuting: true,
      taskExecutionState: 'executing',
      output: null
    });

    // then
    expect(queryByText(/Running test/i)).to.exist;
    expect(queryByText(/No run yet/i)).to.not.exist;
  });


  it('should render success card', async function() {

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
    const { getAllByRole, getByText, queryByText } = renderWithProps({
      output
    });

    // then
    expect(queryByText('Variables')).to.exist;

    // process scope is shown by default
    let textboxes = getAllByRole('textbox');

    expect(textboxes.some(tb => /"foo": "bar"/i.test(tb.textContent))).to.be.true;
    expect(textboxes.some(tb => /"localFoo": "localBar"/i.test(tb.textContent))).to.be.false;

    // when
    fireEvent.click(getByText('Local'));

    // then
    await waitFor(() => {
      textboxes = getAllByRole('textbox');

      expect(textboxes.some(tb => /"localFoo": "localBar"/i.test(tb.textContent))).to.be.true;
    });
  });


  it('should render error card', async function() {

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
    expect(queryByText(/Could not start test/i)).to.exist;
    expect(queryByText('Foo')).to.exist;
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


  it('should not render strips for error output without started instance', async function() {

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
    const { queryByText } = renderWithProps({
      output
    });

    // then
    expect(queryByText('Variables')).to.not.exist;
    expect(queryByText('Timeline')).to.not.exist;
  });


  it('should render variables for error output with started instance', async function() {

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
    const { getAllByRole, getByText, queryByText } = renderWithProps({
      output,
      executionLog: [ createInstanceStartedEntry() ]
    });

    // then
    expect(queryByText('Variables')).to.exist;

    // strips are collapsed by default on error
    fireEvent.click(getByText('Variables'));

    await waitFor(() => {
      const textboxes = getAllByRole('textbox');

      expect(textboxes.some(tb => /"foo": "bar"/i.test(tb.textContent))).to.be.true;
    });
  });


  it('should render incident card', async function() {

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
    expect(queryByText(/^Incident$/i)).to.exist;
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
    expect(queryByText('JOB_NO_RETRIES')).to.exist;
    expect(queryByText('No retries left')).to.exist;
  });


  it('should auto-expand timeline on incident', async function() {

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
    expect(queryByText('1 error')).to.exist;
    expect(queryByText('Result does not have a log.')).to.exist;
  });


  it('should collapse timeline by default on success', async function() {

    // given
    const output = {
      success: true,
      variables: {}
    };

    // when
    const { queryByText } = renderWithProps({ output });

    // then
    expect(queryByText('0 events')).to.exist;
    expect(queryByText('Result does not have a log.')).to.not.exist;
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
    const { getAllByRole, getByText, queryByText } = renderWithProps({
      output
    });

    // then
    expect(queryByText('Variables')).to.exist;

    // strips are collapsed by default on incident
    fireEvent.click(getByText('Variables'));

    await waitFor(() => {
      const textboxes = getAllByRole('textbox');

      expect(textboxes.some(tb => /"foo": "bar"/i.test(tb.textContent))).to.be.true;
    });
  });


  it('should render terminated card', async function() {

    // given
    const output = {
      success: false,
      terminated: true
    };

    // when
    const { queryByText } = renderWithProps({ output });

    // then
    expect(queryByText(/Instance terminated/i)).to.exist;
    expect(queryByText(/Terminated before the test could complete\./i)).to.exist;
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
    const { getAllByRole, getByText, queryByText } = renderWithProps({
      output
    });

    // then
    expect(queryByText('Variables')).to.exist;

    // strips are collapsed by default when terminated
    fireEvent.click(getByText('Variables'));

    await waitFor(() => {
      const textboxes = getAllByRole('textbox');

      expect(textboxes.some(tb => /"foo": "bar"/i.test(tb.textContent))).to.be.true;
    });
  });


  it('should render canceled card', async function() {

    // given
    const output = {
      success: false,
      canceled: true
    };

    // when
    const { queryByText } = renderWithProps({ output });

    // then
    expect(queryByText(/Test canceled/i)).to.exist;
    expect(queryByText(/You stopped the test\./i)).to.exist;
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
    const { getAllByRole, getByText, queryByText } = renderWithProps({ output });

    // then
    expect(queryByText('Variables')).to.exist;

    // strips are collapsed by default when canceled
    fireEvent.click(getByText('Variables'));

    await waitFor(() => {
      const textboxes = getAllByRole('textbox');

      expect(textboxes.some(tb => /"myVar": "snapshot"/i.test(tb.textContent))).to.be.true;
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

});


describe('getWaitingContext', function() {

  it('should return null for empty entries', function() {
    expect(getWaitingContext([], null, null)).to.be.null;
    expect(getWaitingContext(undefined, null, null)).to.be.null;
  });


  it('should return job context for pending job', function() {

    // given
    const entries = [
      createJobEntry(createJobDetails(), createMockTimestamp(), {
        state: 'CREATED',
        type: 'io.camunda:http-json:1'
      })
    ];

    // when
    const context = getWaitingContext(entries, null, 'https://operate.example.com');

    // then
    expect(context).to.exist;
    expect(context.title).to.equal('Waiting for job');
    expect(context.description).to.exist;
    expect(context.linkUrl).to.equal('https://operate.example.com');
    expect(context.linkLabel).to.equal('Open in Operate');
  });


  it('should return null for completed job', function() {

    // given
    const entries = [
      createJobEntry(createJobDetails(), createMockTimestamp(), {
        state: 'COMPLETED',
        type: 'io.camunda:http-json:1'
      })
    ];

    // when
    const context = getWaitingContext(entries, null, 'https://operate.example.com');

    // then
    expect(context).to.be.null;
  });


  it('should return null for failed job', function() {

    // given
    const entries = [
      createJobEntry(createJobDetails(), createMockTimestamp(), {
        state: 'FAILED',
        type: 'io.camunda:http-json:1'
      })
    ];

    // when
    const context = getWaitingContext(entries, null, 'https://operate.example.com');

    // then
    expect(context).to.be.null;
  });


  it('should skip CREATED job when a FAILED entry exists for the same jobKey', function() {

    // given
    const entries = [
      createJobEntry(createJobDetails(), createMockTimestamp(), {
        state: 'CREATED',
        type: 'io.camunda:http-json:1',
        jobKey: '100'
      }),
      createJobEntry(createJobDetails(), createMockTimestamp(), {
        state: 'FAILED',
        type: 'io.camunda:http-json:1',
        jobKey: '100'
      })
    ];

    // when
    const context = getWaitingContext(entries, null, 'https://operate.example.com');

    // then
    expect(context).to.be.null;
  });


  it('should skip job with CREATED entry when a COMPLETED entry exists for the same jobKey', function() {

    // given
    const entries = [
      createJobEntry(createJobDetails(), createMockTimestamp(), {
        state: 'CREATED',
        type: 'io.camunda:listener-job:1',
        jobKey: '100'
      }),
      createJobEntry(createJobDetails(), createMockTimestamp(), {
        state: 'COMPLETED',
        type: 'io.camunda:listener-job:1',
        jobKey: '100'
      }),
      createJobEntry(createJobDetails(), createMockTimestamp(), {
        state: 'CREATED',
        type: 'io.camunda:http-json:1',
        jobKey: '200'
      })
    ];

    // when
    const context = getWaitingContext(entries, null, 'https://operate.example.com');

    // then
    expect(context).to.exist;
    expect(context.title).to.equal('Waiting for job');
    expect(context.description).to.exist;
  });


  it('should return null when all jobs have matching COMPLETED entries', function() {

    // given
    const entries = [
      createJobEntry(createJobDetails(), createMockTimestamp(), {
        state: 'CREATED',
        type: 'io.camunda:listener-job:1',
        jobKey: '100'
      }),
      createJobEntry(createJobDetails(), createMockTimestamp(), {
        state: 'COMPLETED',
        type: 'io.camunda:listener-job:1',
        jobKey: '100'
      })
    ];

    // when
    const context = getWaitingContext(entries, null, 'https://operate.example.com');

    // then
    expect(context).to.be.null;
  });


  it('should return job context without link when no operateUrl', function() {

    // given
    const entries = [
      createJobEntry(createJobDetails(), createMockTimestamp(), {
        state: 'CREATED',
        type: 'io.camunda:http-json:1'
      })
    ];

    // when
    const context = getWaitingContext(entries, null, null);

    // then
    expect(context).to.exist;
    expect(context.linkUrl).to.be.null;
  });


  it('should return message subscription context', function() {

    // given
    const entries = [
      createMessageSubscriptionEntry({
        messageSubscriptionState: 'CREATED'
      })
    ];

    // when
    const context = getWaitingContext(entries, null, 'https://operate.example.com');

    // then
    expect(context).to.exist;
    expect(context.title).to.equal('Waiting for message');
    expect(context.description).to.exist;
    expect(context.linkUrl).to.equal('https://operate.example.com');
    expect(context.linkLabel).to.equal('Open in Operate');
  });


  it('should return null for correlated message', function() {

    // given
    const entries = [
      createMessageSubscriptionEntry({
        messageSubscriptionState: 'CORRELATED'
      })
    ];

    // when
    const context = getWaitingContext(entries, null, 'https://operate.example.com');

    // then
    expect(context).to.be.null;
  });


  it('should return user task context', function() {

    // given
    const entries = [
      createUserTaskEntry({
        state: 'CREATED',
        userTaskKey: '1'
      })
    ];

    // when
    const context = getWaitingContext(entries, 'https://tasklist.example.com', null);

    // then
    expect(context).to.exist;
    expect(context.title).to.equal('Waiting for user task');
    expect(context.description).to.exist;
    expect(context.linkUrl).to.equal('https://tasklist.example.com/1');
    expect(context.linkLabel).to.equal('Open in Tasklist');
  });


  it('should return null for completed user task', function() {

    // given
    const entries = [
      createUserTaskEntry({
        state: 'COMPLETED'
      })
    ];

    // when
    const context = getWaitingContext(entries, 'https://tasklist.example.com', null);

    // then
    expect(context).to.be.null;
  });


  it('should return user task context without link when no tasklistBaseUrl', function() {

    // given
    const entries = [
      createUserTaskEntry({
        state: 'CREATED',
        userTaskKey: '1'
      })
    ];

    // when
    const context = getWaitingContext(entries, null, null);

    // then
    expect(context).to.exist;
    expect(context.linkUrl).to.be.null;
  });


  it('should prioritize user task over message and job', function() {

    // given
    const entries = [
      createJobEntry(createJobDetails(), createMockTimestamp(), { state: 'CREATED' }),
      createMessageSubscriptionEntry({ messageSubscriptionState: 'CREATED' }),
      createUserTaskEntry({ state: 'CREATED', userTaskKey: '1' })
    ];

    // when
    const context = getWaitingContext(entries, null, null);

    // then
    expect(context.title).to.equal('Waiting for user task');
  });


  it('should return context for active call activity', function() {

    // given
    const entries = [
      createCallActivityEntry({
        state: 'ACTIVE',
        elementInstanceKey: '1',
        childProcessInstanceKey: '2'
      })
    ];

    // when
    const context = getWaitingContext(entries, null, null, 'https://operate.example.com');

    // then
    expect(context).to.exist;
    expect(context.title).to.equal('Waiting for called process');
    expect(context.linkLabel).to.equal('Open called process');
    expect(context.linkUrl).to.equal('https://operate.example.com/processes/2');
  });


  it('should return null for completed call activity', function() {

    // given
    const entries = [
      createCallActivityEntry({ state: 'ACTIVE', elementInstanceKey: '1' }),
      createCallActivityEntry({ state: 'COMPLETED', elementInstanceKey: '1' })
    ];

    // when
    const context = getWaitingContext(entries, null, null, 'https://operate.example.com');

    // then
    expect(context).to.be.null;
  });


  it('should return context for active call activity without child process instance', function() {

    // given
    const entries = [
      createCallActivityEntry({ state: 'ACTIVE', elementInstanceKey: '1' })
    ];

    // when
    const context = getWaitingContext(entries, null, null, 'https://operate.example.com');

    // then
    expect(context).to.exist;
    expect(context.linkUrl).to.be.null;
  });

});


function renderWithProps(props = {}) {
  const {
    element,
    isConnectionConfigured = true,
    errorBannerTitle,
    onConfigure,
    inputError = null,
    currentOperateUrl = null,
    isTaskExecuting = false,
    output = null,
    onResetOutput = () => {},
    taskExecutionState,
    executionLog = [],
    tasklistBaseUrl,
    operateBaseUrl,
    currentVariables,
    executionStartedAt = null
  } = props;


  return render(
    <Wrapper>
      <Output
        element={ element }
        isConnectionConfigured={ isConnectionConfigured }
        errorBannerTitle={ errorBannerTitle }
        onConfigure={ onConfigure }
        inputError={ inputError }
        currentOperateUrl={ currentOperateUrl }
        isTaskExecuting={ isTaskExecuting }
        output={ output }
        onResetOutput={ onResetOutput }
        taskExecutionState={ taskExecutionState }
        executionLog={ executionLog }
        tasklistBaseUrl={ tasklistBaseUrl }
        operateBaseUrl={ operateBaseUrl }
        currentVariables={ currentVariables }
        executionStartedAt={ executionStartedAt }
      />
    </Wrapper>
  );
}

const Wrapper = (props) => {
  const pluginsProviderValue = usePluginsProviderValue();

  return (
    <TooltipProvider>
      <PluginContext.Provider value={ pluginsProviderValue }>
        { props.children }
      </PluginContext.Provider>
    </TooltipProvider>
  );
};

function createInstanceStartedEntry(timestamp = 0) {
  return {
    type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
    status: EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED,
    data: {
      processInstanceKey: '1'
    },
    timestamp
  };
}

function createUserTaskEntry(data, timestamp = 0) {
  return {
    type: EXECUTION_LOG_ENTRY_TYPE.USER_TASK,
    data: {
      state: 'CREATED',
      name: 'Foo',
      userTaskKey: '1',
      ...data
    },
    timestamp
  };
}

function createCallActivityEntry(data, timestamp = 0) {
  return {
    type: EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE,
    data: {
      type: 'CALL_ACTIVITY',
      elementId: 'CallActivity_1',
      elementName: 'Call activity',
      state: 'ACTIVE',
      elementInstanceKey: '1',
      ...data
    },
    timestamp
  };
}

function createMessageSubscriptionEntry(data, timestamp = 0) {
  return {
    type: EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION,
    data: {
      messageName: 'Message_1',
      elementId: 'Event_1',
      messageSubscriptionState: 'CREATED',
      messageSubscriptionKey: '1',
      ...data
    },
    timestamp
  };
}