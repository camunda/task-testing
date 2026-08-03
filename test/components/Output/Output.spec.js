/**
 * @import {
 *   ElementOutput,
 *   ElementOutputVariables
 * }
 */

import React from 'react';

import { render } from '@testing-library/react';

import Output, { getWaitingContext } from '../../../lib/components/Output/Output';

import {
  createJobEntry,
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
    expect(context.title).to.equal('Waiting for job completion');
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
    expect(context.title).to.equal('Waiting for job completion');
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
    expect(context.title).to.equal('Waiting for message correlation');
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
    expect(context.title).to.equal('Waiting for user task completion');
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
    expect(context.title).to.equal('Waiting for user task completion');
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
    expect(context.title).to.equal('Waiting for called process completion');
    expect(context.linkLabel).to.equal('Open called process in Operate');
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