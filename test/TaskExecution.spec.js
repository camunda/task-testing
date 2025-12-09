import sinon from 'sinon';

import { bootstrapModeler, inject } from './util/Util';

import TaskExecution, { getVariables, INTERVAL_MS, SCOPES } from '../lib/TaskExecution';

describe('TaskExecution', function() {

  let clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
  });

  afterEach(function() {
    clock.restore();
  });

  beforeEach(bootstrapModeler());

  let api, taskExecution;

  const statusChangeSpy = sinon.spy();
  const finishedSpy = sinon.spy();
  const errorSpy = sinon.spy();

  beforeEach(inject(function(injector) {
    api = {
      deploy: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      startInstance: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstance: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstanceVariables: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstanceElementInstances: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstanceIncident: sinon.stub().resolves({ success: false, error: 'Not implemented' })
    };

    taskExecution = new TaskExecution(injector, api);

    taskExecution.on('taskExecution.status.changed', statusChangeSpy);
    taskExecution.on('taskExecution.finished', finishedSpy);
    taskExecution.on('taskExecution.error', errorSpy);
  }));

  afterEach(function() {
    taskExecution.removeAllListeners();

    statusChangeSpy.resetHistory();
    finishedSpy.resetHistory();
    errorSpy.resetHistory();
  });


  it('should execute a task', async function() {

    // given
    api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
    api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });
    api.getProcessInstance.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_RESPONSE });
    api.getProcessInstanceVariables.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_VARIABLES_RESPONSE });
    api.getProcessInstanceElementInstances.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_ELEMENT_INSTANCES_RESPONSE });

    // when
    taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

    await clock.tickAsync(1500);

    // then
    expect(statusChangeSpy).to.have.been.calledWith('deploying');
    expect(statusChangeSpy).to.have.been.calledWith('starting-instance');
    expect(statusChangeSpy).to.have.been.calledWith('executing');

    expect(errorSpy).to.not.have.been.called;

    expect(api.deploy).to.have.been.calledOnce;
    expect(api.startInstance).to.have.been.calledOnce;
    expect(api.getProcessInstance).to.have.been.calledOnce;
    expect(api.getProcessInstanceVariables).to.have.been.calledOnce;
    expect(api.getProcessInstanceElementInstances).to.have.been.calledOnce;
    expect(api.getProcessInstanceIncident).to.not.have.been.called;

    expect(finishedSpy).to.have.been.calledWithMatch({
      'incident': null,
      'success': true,
      'variables': {
        '2251799813755923': {
          'name': 'foo',
          'value': 'bar',
          'scope': 'PROCESS'
        },
        '2251799813755924': {
          'name': 'baz',
          'value': 42,
          'scope': 'PROCESS'
        }
      }
    });

    expect(finishedSpy.firstCall.args[0]).to.have.property('executionTime').that.is.a('number');
  });


  it('should execute a task and poll until process instance found', async function() {

    // given
    api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
    api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });
    api.getProcessInstance.onFirstCall().resolves({ success: true, response: { items: [] } });
    api.getProcessInstance.onSecondCall().resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_RESPONSE });
    api.getProcessInstanceVariables.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_VARIABLES_RESPONSE });
    api.getProcessInstanceElementInstances.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_ELEMENT_INSTANCES_RESPONSE });

    // when
    taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

    await clock.tickAsync(2500);

    // then
    expect(finishedSpy).to.have.been.calledOnce;
    expect(errorSpy).to.not.have.been.called;
    expect(api.deploy).to.have.been.calledOnce;
    expect(api.startInstance).to.have.been.calledOnce;
    expect(api.getProcessInstance).to.have.been.calledTwice;
    expect(api.getProcessInstanceVariables).to.have.been.calledOnce;
    expect(api.getProcessInstanceElementInstances).to.have.been.calledOnce;
    expect(api.getProcessInstanceIncident).to.not.have.been.called;

    expect(finishedSpy).to.have.been.calledWithMatch({
      'incident': null,
      'variables': {
        '2251799813755923': {
          'name': 'foo',
          'value': 'bar',
          'scope': 'PROCESS'
        },
        '2251799813755924': {
          'name': 'baz',
          'value': 42,
          'scope': 'PROCESS'
        }
      }
    });
  });


  it('should execute a task and not finish if process instance is still active', async function() {

    // given
    api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
    api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });
    api.getProcessInstance.resolves({ success: true, response: {
      items: [
        {
          'processDefinitionId': 'Process_TaskTesting',
          'processDefinitionName': 'Process_TaskTesting',
          'processDefinitionVersion': 1,
          'startDate': '2025-09-04T12:43:52.704Z',
          'endDate': null,
          'state': 'ACTIVE',
          'hasIncident': false,
          'tenantId': '<default>',
          'processInstanceKey': '2251799813755922',
          'processDefinitionKey': '2251799813686881'
        }
      ]
    } });

    // when
    taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

    await clock.tickAsync(2500);

    // then
    expect(finishedSpy).to.not.have.been.called;
    expect(errorSpy).to.not.have.been.called;
    expect(api.deploy).to.have.been.calledOnce;
    expect(api.startInstance).to.have.been.calledOnce;
    expect(api.getProcessInstance).to.have.been.calledTwice;
    expect(api.getProcessInstanceVariables).to.not.have.been.called;
    expect(api.getProcessInstanceIncident).to.not.have.been.called;
  });


  describe('errors', function() {

    it('should handle deploy error', async function() {

      // given
      api.deploy.resolves({ success: false, error: DEPLOY_ERROR });

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      // then
      expect(finishedSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.calledOnce;
      expect(statusChangeSpy).to.have.been.calledWith('deploying');
      expect(api.deploy).to.have.been.calledOnce;
      expect(api.startInstance).to.not.have.been.called;
      expect(api.getProcessInstance).to.not.have.been.called;
      expect(api.getProcessInstanceVariables).to.not.have.been.called;
      expect(api.getProcessInstanceIncident).to.not.have.been.called;

      expect(errorSpy).to.have.been.calledWithMatch({
        message: 'Failed to deploy process definition',
        response: DEPLOY_ERROR
      });

      expect(errorSpy.firstCall.args[0]).to.have.property('executionTime').that.is.a('number');
    });


    it('should handle no process ID error', async function() {

      // given
      api.deploy.resolves({ success: true, response: {
        items: [
          {
            processDefinitionId: null,
            processDefinitionVersion: 1,
            resourceName: 'diagram.bpmn',
            tenantId: '<default>',
            processDefinitionKey: '2251799813686881'
          }
        ]
      } });

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      // then
      expect(finishedSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.calledOnce;
      expect(statusChangeSpy).to.have.been.calledWith('deploying');
      expect(api.deploy).to.have.been.calledOnce;
      expect(api.startInstance).to.not.have.been.called;
      expect(api.getProcessInstance).to.not.have.been.called;
      expect(api.getProcessInstanceVariables).to.not.have.been.called;
      expect(api.getProcessInstanceIncident).to.not.have.been.called;

      expect(errorSpy).to.have.been.calledWithMatch({
        message: 'Failed to retrieve process ID from deployment response'
      });
    });


    it('should handle start instance error', async function() {

      // given
      api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
      api.startInstance.resolves({ success: false, error: START_INSTANCE_ERROR });

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      // then
      expect(finishedSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.calledOnce;
      expect(statusChangeSpy).to.have.been.calledWith('deploying');
      expect(api.deploy).to.have.been.calledOnce;
      expect(statusChangeSpy).to.have.been.calledWith('starting-instance');
      expect(api.startInstance).to.have.been.calledOnce;
      expect(api.getProcessInstance).to.not.have.been.called;
      expect(api.getProcessInstanceVariables).to.not.have.been.called;
      expect(api.getProcessInstanceIncident).to.not.have.been.called;

      expect(errorSpy).to.have.been.calledWithMatch({
        message: 'Failed to start process instance',
        response: START_INSTANCE_ERROR
      });
    });


    it('should handle no process instance key error', async function() {

      // given
      api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
      api.startInstance.resolves({ success: true, response: {
        'processDefinitionId': 'Process_TaskTesting',
        'processDefinitionVersion': 1,
        'tenantId': '<default>',
        'variables': {},
        'processDefinitionKey': '2251799813686881',
        'processInstanceKey': null,
        'tags': []
      } });

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      // then
      expect(finishedSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.calledOnce;
      expect(statusChangeSpy).to.have.been.calledWith('starting-instance');
      expect(api.deploy).to.have.been.calledOnce;
      expect(statusChangeSpy).to.have.been.calledWith('deploying');
      expect(api.startInstance).to.have.been.calledOnce;
      expect(api.getProcessInstance).to.not.have.been.called;
      expect(api.getProcessInstanceVariables).to.not.have.been.called;
      expect(api.getProcessInstanceIncident).to.not.have.been.called;

      expect(errorSpy).to.have.been.calledWithMatch({
        message: 'Failed to retrieve process instance key from start instance response'
      });
    });


    it('should handle get process instance error (retry)', async function() {

      // given
      api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
      api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });
      api.getProcessInstance.onFirstCall().resolves({ success: false, error: GET_PROCESS_INSTANCE_ERROR });
      api.getProcessInstance.onSecondCall().resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_RESPONSE });
      api.getProcessInstanceVariables.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_VARIABLES_RESPONSE });
      api.getProcessInstanceElementInstances.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_ELEMENT_INSTANCES_RESPONSE });

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(INTERVAL_MS * 2);

      // then
      expect(finishedSpy).to.have.been.calledOnce;
      expect(errorSpy).to.have.been.calledOnce;
      expect(api.deploy).to.have.been.calledOnce;
      expect(api.startInstance).to.have.been.calledOnce;
      expect(api.getProcessInstance).to.have.been.calledTwice;
      expect(api.getProcessInstanceVariables).to.have.been.calledOnce;
      expect(api.getProcessInstanceElementInstances).to.have.been.calledOnce;
      expect(api.getProcessInstanceIncident).to.not.have.been.called;

      expect(errorSpy).to.have.been.calledWithMatch({
        message: 'Failed to get process instance',
        response: GET_PROCESS_INSTANCE_ERROR
      });
    });
  });


  describe('incidents', function() {

    it('should handle incident', async function() {

      // given
      api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
      api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });
      api.getProcessInstance.resolves({ success: true, response: {
        items: [
          {
            'processDefinitionId': 'Process_TaskTesting',
            'processDefinitionName': 'Process_TaskTesting',
            'processDefinitionVersion': 1,
            'startDate': '2025-09-04T12:43:52.704Z',
            'endDate': null,
            'state': 'ACTIVE',
            'hasIncident': true,
            'tenantId': '<default>',
            'processInstanceKey': '2251799813755922',
            'processDefinitionKey': '2251799813686881'
          }
        ]
      } });
      api.getProcessInstanceIncident.resolves({ success: true, response: {
        items: [
          {
            key: '2251799814592731',
            processDefinitionKey: '2251799814239639',
            processInstanceKey: '2251799814592711',
            type: 'JOB_NO_RETRIES',
            message: 'Bad gateway',
            creationTime: '2025-08-21T14:40:55.402+0000',
            state: 'ACTIVE',
            jobKey: '2251799814592726',
            tenantId: '<default>'
          }
        ]
      } });
      api.getProcessInstanceVariables.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_VARIABLES_RESPONSE });
      api.getProcessInstanceElementInstances.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_ELEMENT_INSTANCES_RESPONSE });

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(1500);

      // then
      expect(finishedSpy).to.have.been.calledOnce;
      expect(errorSpy).to.not.have.been.called;
      expect(api.deploy).to.have.been.calledOnce;
      expect(api.startInstance).to.have.been.calledOnce;
      expect(api.getProcessInstance).to.have.been.calledOnce;
      expect(api.getProcessInstanceVariables).to.have.been.calledOnce;
      expect(api.getProcessInstanceElementInstances).to.have.been.calledOnce;
      expect(api.getProcessInstanceIncident).to.have.been.calledOnce;

      expect(finishedSpy).to.have.been.calledWithMatch({
        'success': false,
        'variables': {
          '2251799813755923': {
            'name': 'foo',
            'value': 'bar',
            'scope': 'PROCESS'
          },
          '2251799813755924': {
            'name': 'baz',
            'value': 42,
            'scope': 'PROCESS'
          }
        },
        'incident': {
          key: '2251799814592731',
          processDefinitionKey: '2251799814239639',
          processInstanceKey: '2251799814592711',
          type: 'JOB_NO_RETRIES',
          message: 'Bad gateway',
          creationTime: '2025-08-21T14:40:55.402+0000',
          state: 'ACTIVE',
          jobKey: '2251799814592726',
          tenantId: '<default>'
        }
      });
    });

  });


  describe('cancelling', function() {

    it('should cancel running task execution', async function() {

      // given
      api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
      api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });
      api.getProcessInstance.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_RESPONSE });

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      taskExecution.cancelTaskExecution();

      await clock.tickAsync(500);

      // then
      expect(finishedSpy).to.not.have.been.called;
      expect(errorSpy).to.not.have.been.called;
      expect(api.deploy).to.have.been.calledOnce;
      expect(api.startInstance).to.have.been.calledOnce;
      expect(api.getProcessInstance).to.not.have.been.called;
      expect(api.getProcessInstanceVariables).to.not.have.been.called;
      expect(api.getProcessInstanceIncident).to.not.have.been.called;
    });


    it('should cancel on <selection.changed>', inject(async function(elementRegistry, selection) {

      // given
      api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
      api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });
      api.getProcessInstance.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_RESPONSE });

      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      // when
      const task = elementRegistry.get('StartEvent_1');

      selection.select(task);

      await clock.tickAsync(500);

      // then
      expect(finishedSpy).to.not.have.been.called;
      expect(errorSpy).to.not.have.been.called;
      expect(api.deploy).to.have.been.calledOnce;
      expect(api.startInstance).to.have.been.calledOnce;
      expect(api.getProcessInstance).to.not.have.been.called;
      expect(api.getProcessInstanceVariables).to.not.have.been.called;
      expect(api.getProcessInstanceIncident).to.not.have.been.called;
    }));


    it('should handle canceling after starting instance', async function() {

      // given
      api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
      api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });
      api.getProcessInstance.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_RESPONSE });

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      // assume
      expect(statusChangeSpy).to.have.been.calledWith('executing');
      expect(api.startInstance).to.have.been.calledOnce;

      // when
      taskExecution.cancelTaskExecution();

      // then
      expect(statusChangeSpy).to.have.been.calledWith('idle');
      expect(finishedSpy).to.not.have.been.called;
      expect(api.getProcessInstanceVariables).to.not.have.been.called;
      expect(api.getProcessInstanceIncident).to.not.have.been.called;
    });


    it('should noop when canceling without running task execution', async function() {

      // when
      taskExecution.cancelTaskExecution();

      await clock.tickAsync(500);

      // then
      expect(finishedSpy).to.not.have.been.called;
    });

  });


  describe('#getVariables', function() {

    it('should get variables with scope', function() {

      // given
      const getVariablesResponseItems = [
        {
          variableKey: 1,
          name: 'localFoo',
          value: 'bar',
          scopeKey: '1'
        },
        {
          variableKey: 2,
          name: 'localBaz',
          value: 42,
          scopeKey: '1'
        },
        {
          variableKey: 3,
          name: 'processFoo',
          value: true,
          scopeKey: '1'
        },
        {
          variableKey: 4,
          name: 'processFoo',
          value: true,
          scopeKey: '2'
        },
        {
          variableKey: 5,
          name: 'otherLocalFoo',
          value: 'baz',
          scopeKey: '3'
        }
      ];

      const getElementInstancesResponseItems = [
        {
          elementId: 'ServiceTask_1',
          elementInstanceKey: '1'
        }
      ];

      // when
      const variables = getVariables(
        getVariablesResponseItems,
        getElementInstancesResponseItems,
        {
          processInstanceKey: '2'
        },
        'ServiceTask_1'
      );

      // then
      expect(variables).to.eql({
        1: { name: 'localFoo', value: 'bar', scope: SCOPES.LOCAL },
        2: { name: 'localBaz', value: 42, scope: SCOPES.LOCAL },
        3: { name: 'processFoo', value: true, scope: SCOPES.LOCAL },
        4: { name: 'processFoo', value: true, scope: SCOPES.PROCESS },
        5: { name: 'otherLocalFoo', value: 'baz', scope: null }
      });
    });

  });


  describe('execution time tracking', function() {

    it('should include execution time on successful task execution', async function() {

      // given
      api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
      api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });
      api.getProcessInstance.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_RESPONSE });
      api.getProcessInstanceVariables.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_VARIABLES_RESPONSE });
      api.getProcessInstanceElementInstances.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_ELEMENT_INSTANCES_RESPONSE });

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(1500);

      // then
      expect(finishedSpy).to.have.been.calledOnce;

      const result = finishedSpy.firstCall.args[0];

      expect(result).to.have.property('executionTime');
      expect(result.executionTime).to.be.a('number');
      expect(result.executionTime).to.be.at.least(0);
    });


    it('should include execution time on error', async function() {

      // given
      api.deploy.resolves({ success: false, error: DEPLOY_ERROR });

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      // then
      expect(errorSpy).to.have.been.calledOnce;

      const error = errorSpy.firstCall.args[0];

      expect(error).to.have.property('executionTime');
      expect(error.executionTime).to.be.a('number');
      expect(error.executionTime).to.be.at.least(0);
    });


    it('should include execution time on incident', async function() {

      // given
      api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
      api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });
      api.getProcessInstance.resolves({ success: true, response: {
        items: [
          {
            'processDefinitionId': 'Process_TaskTesting',
            'processDefinitionName': 'Process_TaskTesting',
            'processDefinitionVersion': 1,
            'startDate': '2025-09-04T12:43:52.704Z',
            'endDate': null,
            'state': 'ACTIVE',
            'hasIncident': true,
            'tenantId': '<default>',
            'processInstanceKey': '2251799813755922',
            'processDefinitionKey': '2251799813686881'
          }
        ]
      } });
      api.getProcessInstanceIncident.resolves({ success: true, response: {
        items: [
          {
            key: '2251799814592731',
            processDefinitionKey: '2251799814239639',
            processInstanceKey: '2251799814592711',
            type: 'JOB_NO_RETRIES',
            message: 'Bad gateway',
            creationTime: '2025-08-21T14:40:55.402+0000',
            state: 'ACTIVE',
            jobKey: '2251799814592726',
            tenantId: '<default>'
          }
        ]
      } });
      api.getProcessInstanceVariables.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_VARIABLES_RESPONSE });
      api.getProcessInstanceElementInstances.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_ELEMENT_INSTANCES_RESPONSE });

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(1500);

      // then
      expect(finishedSpy).to.have.been.calledOnce;

      const result = finishedSpy.firstCall.args[0];

      expect(result).to.have.property('executionTime');
      expect(result.executionTime).to.be.a('number');
      expect(result.executionTime).to.be.at.least(0);
      expect(result.success).to.be.false;
    });


    it('should reset execution start time on cancel', async function() {

      // given
      api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
      api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      taskExecution.cancelTaskExecution();

      // then
      expect(taskExecution._executionStartTime).to.be.null;
    });


    it('should set execution start time when task execution starts', async function() {

      // given
      api.deploy.callsFake(() => new Promise(() => {})); // Never resolves

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      // then
      expect(taskExecution._executionStartTime).to.be.a('number');
    });

  });

});

const DEFAULT_DEPLOY_RESPONSE = {
  'deploymentKey': '2251799813755914',
  'tenantId': '<default>',
  'deployments': [
    {
      'processDefinition': {
        'processDefinitionId': 'Process_TaskTesting',
        'processDefinitionVersion': 1,
        'resourceName': 'diagram.bpmn',
        'tenantId': '<default>',
        'processDefinitionKey': '2251799813686881'
      }
    }
  ],
  'processes': [
    {
      'processDefinitionId': 'Process_TaskTesting',
      'processDefinitionVersion': 1,
      'resourceName': 'diagram.bpmn',
      'tenantId': '<default>',
      'processDefinitionKey': '2251799813686881'
    }
  ],
  'decisions': [],
  'forms': [],
  'decisionRequirements': []
};

const DEPLOY_ERROR = 'Response code 400 (Bad Request) (POST https://lpp-1.zeebe.dev.ultrawombat.com/859915fd-36c3-4a8c-b19e-5fb1e21dade9/v2/deployments). {"type":"about:blank","title":"INVALID_ARGUMENT","status":400,"detail":"Command \'CREATE\' rejected with code \'INVALID_ARGUMENT\': Expected to deploy new resources, but encountered the following errors:\\n\'diagram.bpmn\': - Element: Process_TaskTesting\\n    - ERROR: Must have at least one start event\\n","instance":"/859915fd-36c3-4a8c-b19e-5fb1e21dade9/v2/deployments"}. Enhanced stack trace available as error.source.';

const DEFAULT_START_INSTANCE_RESPONSE = {
  'processDefinitionId': 'Process_TaskTesting',
  'processDefinitionVersion': 1,
  'tenantId': '<default>',
  'variables': {},
  'processDefinitionKey': '2251799813686881',
  'processInstanceKey': '2251799813755922',
  'tags': []
};

const START_INSTANCE_ERROR = 'Response code 400 (Bad Request) (POST https://lpp-1.zeebe.dev.ultrawombat.com/859915fd-36c3-4a8c-b19e-5fb1e21dade9/v2/process-instances). {"type":"about:blank","title":"Bad Request","status":400,"detail":"Request property [runtimeInstructions.null] cannot be parsed","instance":"/859915fd-36c3-4a8c-b19e-5fb1e21dade9/v2/process-instances"}. Enhanced stack trace available as error.source.';

const DEFAULT_GET_PROCESS_INSTANCE_RESPONSE = {
  'items': [
    {
      'processDefinitionId': 'Process_TaskTesting',
      'processDefinitionName': 'Process_TaskTesting',
      'processDefinitionVersion': 1,
      'startDate': '2025-09-04T12:43:52.704Z',
      'endDate': '2025-09-04T12:43:52.704Z',
      'state': 'TERMINATED',
      'hasIncident': false,
      'tenantId': '<default>',
      'processInstanceKey': '2251799813755922',
      'processDefinitionKey': '2251799813686881'
    }
  ],
  'page': {
    'totalItems': 1,
    'hasMoreTotalItems': false,
    'startCursor': 'WzIyNTE3OTk4MTM3NTU5MjJd',
    'endCursor': 'WzIyNTE3OTk4MTM3NTU5MjJd'
  }
};

const GET_PROCESS_INSTANCE_ERROR = 'FOO';

const DEFAULT_GET_PROCESS_INSTANCE_VARIABLES_RESPONSE = {
  'items': [
    {
      'value': 'bar',
      'isTruncated': false,
      'name': 'foo',
      'tenantId': '<default>',
      'variableKey': '2251799813755923',
      'scopeKey': '2251799813755922',
      'processInstanceKey': '2251799813755922'
    },
    {
      'value': '42',
      'isTruncated': false,
      'name': 'baz',
      'tenantId': '<default>',
      'variableKey': '2251799813755924',
      'scopeKey': '2251799813755922',
      'processInstanceKey': '2251799813755922'
    }
  ],
  'page': {
    'totalItems': 2,
    'hasMoreTotalItems': false,
    'startCursor': 'WzIyNTE3OTk4MTM3NTU5MjNd',
    'endCursor': 'WzIyNTE3OTk4MTM3NTU5NDVd'
  }
};

const DEFAULT_GET_PROCESS_INSTANCE_ELEMENT_INSTANCES_RESPONSE = {
  'items': [
    {
      'processDefinitionId': 'Process_TaskTesting',
      'startDate': '2025-10-16T13:08:56.455Z',
      'endDate': '2025-10-16T13:08:56.455Z',
      'elementId': 'ServiceTask_2',
      'elementName': 'Inputs',
      'type': 'SCRIPT_TASK',
      'state': 'COMPLETED',
      'hasIncident': false,
      'tenantId': '<default>',
      'elementInstanceKey': '2251799817092569',
      'processInstanceKey': '2251799817092566',
      'processDefinitionKey': '2251799817066246'
    }
  ],
  'page': {
    'totalItems': 1,
    'hasMoreTotalItems': false,
    'startCursor': 'WzIyNTE3OTk4MTcwOTI1Njld',
    'endCursor': 'WzIyNTE3OTk4MTcwOTI1Njld'
  }
};