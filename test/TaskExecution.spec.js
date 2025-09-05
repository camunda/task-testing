import sinon from 'sinon';

import { bootstrapModeler, inject } from './util/Util';

import TaskExecution from '../lib/TaskExecution';

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

  beforeEach(inject(function(injector) {
    api = {
      deploy: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      startInstance: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstance: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstanceVariables: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstanceIncident: sinon.stub().resolves({ success: false, error: 'Not implemented' })
    };

    taskExecution = new TaskExecution(injector, api);
  }));


  it('should execute a task', async function() {

    // given
    api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
    api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });
    api.getProcessInstance.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_RESPONSE });
    api.getProcessInstanceVariables.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_VARIABLES_RESPONSE });

    const cancelSpy = sinon.spy();
    const endSpy = sinon.spy();
    const errorSpy = sinon.spy();
    const startSpy = sinon.spy();

    taskExecution.on('taskExecution.cancelled', cancelSpy);
    taskExecution.on('taskExecution.end', endSpy);
    taskExecution.on('taskExecution.error', errorSpy);
    taskExecution.on('taskExecution.start', startSpy);

    // when
    taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

    await clock.tickAsync(1500);

    // then
    expect(cancelSpy).to.not.have.been.called;
    expect(endSpy).to.have.been.called;
    expect(errorSpy).to.not.have.been.called;
    expect(startSpy).to.have.been.calledOnce;
    expect(api.deploy).to.have.been.calledOnce;
    expect(api.startInstance).to.have.been.calledOnce;
    expect(api.getProcessInstance).to.have.been.calledOnce;
    expect(api.getProcessInstanceVariables).to.have.been.calledOnce;
    expect(api.getProcessInstanceIncident).to.not.have.been.called;

    expect(endSpy).to.have.been.calledWithMatch({
      'incident': null,
      'success': true,
      'variables': {
        'foo': 'bar',
        'baz': 42
      }
    });
  });


  it('should execute a task and poll until process instance found', async function() {

    // given
    api.deploy.resolves({ success: true, response: DEFAULT_DEPLOY_RESPONSE });
    api.startInstance.resolves({ success: true, response: DEFAULT_START_INSTANCE_RESPONSE });
    api.getProcessInstance.onFirstCall().resolves({ success: true, response: { items: [] } });
    api.getProcessInstance.onSecondCall().resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_RESPONSE });
    api.getProcessInstanceVariables.resolves({ success: true, response: DEFAULT_GET_PROCESS_INSTANCE_VARIABLES_RESPONSE });

    const cancelSpy = sinon.spy();
    const endSpy = sinon.spy();
    const errorSpy = sinon.spy();
    const startSpy = sinon.spy();

    taskExecution.on('taskExecution.cancelled', cancelSpy);
    taskExecution.on('taskExecution.end', endSpy);
    taskExecution.on('taskExecution.error', errorSpy);
    taskExecution.on('taskExecution.start', startSpy);

    // when
    taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

    await clock.tickAsync(2500);

    // then
    expect(cancelSpy).to.not.have.been.called;
    expect(endSpy).to.have.been.called;
    expect(errorSpy).to.not.have.been.called;
    expect(startSpy).to.have.been.calledOnce;
    expect(api.deploy).to.have.been.calledOnce;
    expect(api.startInstance).to.have.been.calledOnce;
    expect(api.getProcessInstance).to.have.been.calledTwice;
    expect(api.getProcessInstanceVariables).to.have.been.calledOnce;
    expect(api.getProcessInstanceIncident).to.not.have.been.called;

    expect(endSpy).to.have.been.calledWithMatch({
      'incident': null,
      'success': true,
      'variables': {
        'foo': 'bar',
        'baz': 42
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

    const cancelSpy = sinon.spy();
    const endSpy = sinon.spy();
    const errorSpy = sinon.spy();
    const startSpy = sinon.spy();

    taskExecution.on('taskExecution.cancelled', cancelSpy);
    taskExecution.on('taskExecution.end', endSpy);
    taskExecution.on('taskExecution.error', errorSpy);
    taskExecution.on('taskExecution.start', startSpy);

    // when
    taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

    await clock.tickAsync(2500);

    // then
    expect(cancelSpy).to.not.have.been.called;
    expect(endSpy).to.not.have.been.called;
    expect(errorSpy).to.not.have.been.called;
    expect(startSpy).to.have.been.calledOnce;
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

      const cancelSpy = sinon.spy();
      const endSpy = sinon.spy();
      const errorSpy = sinon.spy();
      const startSpy = sinon.spy();

      taskExecution.on('taskExecution.cancelled', cancelSpy);
      taskExecution.on('taskExecution.end', endSpy);
      taskExecution.on('taskExecution.error', errorSpy);
      taskExecution.on('taskExecution.start', startSpy);

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      // then
      expect(cancelSpy).to.have.been.calledOnce;
      expect(endSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.calledOnce;
      expect(startSpy).to.have.been.calledOnce;
      expect(api.deploy).to.have.been.calledOnce;
      expect(api.startInstance).to.not.have.been.called;
      expect(api.getProcessInstance).to.not.have.been.called;
      expect(api.getProcessInstanceVariables).to.not.have.been.called;
      expect(api.getProcessInstanceIncident).to.not.have.been.called;

      expect(errorSpy).to.have.been.calledWithMatch({
        message: 'Failed to deploy process definition',
        detail: DEPLOY_ERROR
      });
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

      const cancelSpy = sinon.spy();
      const endSpy = sinon.spy();
      const errorSpy = sinon.spy();
      const startSpy = sinon.spy();

      taskExecution.on('taskExecution.cancelled', cancelSpy);
      taskExecution.on('taskExecution.end', endSpy);
      taskExecution.on('taskExecution.error', errorSpy);
      taskExecution.on('taskExecution.start', startSpy);

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      // then
      expect(cancelSpy).to.have.been.calledOnce;
      expect(endSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.calledOnce;
      expect(startSpy).to.have.been.calledOnce;
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

      const cancelSpy = sinon.spy();
      const endSpy = sinon.spy();
      const errorSpy = sinon.spy();
      const startSpy = sinon.spy();

      taskExecution.on('taskExecution.cancelled', cancelSpy);
      taskExecution.on('taskExecution.end', endSpy);
      taskExecution.on('taskExecution.error', errorSpy);
      taskExecution.on('taskExecution.start', startSpy);

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      // then
      expect(cancelSpy).to.have.been.calledOnce;
      expect(endSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.calledOnce;
      expect(startSpy).to.have.been.calledOnce;
      expect(api.deploy).to.have.been.calledOnce;
      expect(api.startInstance).to.have.been.calledOnce;
      expect(api.getProcessInstance).to.not.have.been.called;
      expect(api.getProcessInstanceVariables).to.not.have.been.called;
      expect(api.getProcessInstanceIncident).to.not.have.been.called;

      expect(errorSpy).to.have.been.calledWithMatch({
        message: 'Failed to start process instance',
        detail: START_INSTANCE_ERROR
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

      const cancelSpy = sinon.spy();
      const endSpy = sinon.spy();
      const errorSpy = sinon.spy();
      const startSpy = sinon.spy();

      taskExecution.on('taskExecution.cancelled', cancelSpy);
      taskExecution.on('taskExecution.end', endSpy);
      taskExecution.on('taskExecution.error', errorSpy);
      taskExecution.on('taskExecution.start', startSpy);

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      // then
      expect(cancelSpy).to.have.been.calledOnce;
      expect(endSpy).to.not.have.been.called;
      expect(errorSpy).to.have.been.calledOnce;
      expect(startSpy).to.have.been.calledOnce;
      expect(api.deploy).to.have.been.calledOnce;
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

      const cancelSpy = sinon.spy();
      const endSpy = sinon.spy();
      const errorSpy = sinon.spy();
      const startSpy = sinon.spy();

      taskExecution.on('taskExecution.cancelled', cancelSpy);
      taskExecution.on('taskExecution.end', endSpy);
      taskExecution.on('taskExecution.error', errorSpy);
      taskExecution.on('taskExecution.start', startSpy);

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(2500);

      // then
      expect(cancelSpy).to.not.have.been.called;
      expect(endSpy).to.have.been.calledOnce;
      expect(errorSpy).to.have.been.calledOnce;
      expect(startSpy).to.have.been.calledOnce;
      expect(api.deploy).to.have.been.calledOnce;
      expect(api.startInstance).to.have.been.calledOnce;
      expect(api.getProcessInstance).to.have.been.calledTwice;
      expect(api.getProcessInstanceVariables).to.have.been.calledOnce;
      expect(api.getProcessInstanceIncident).to.not.have.been.called;

      expect(errorSpy).to.have.been.calledWithMatch({
        message: 'Failed to get process instance',
        detail: GET_PROCESS_INSTANCE_ERROR
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

      const cancelSpy = sinon.spy();
      const endSpy = sinon.spy();
      const errorSpy = sinon.spy();
      const startSpy = sinon.spy();

      taskExecution.on('taskExecution.cancelled', cancelSpy);
      taskExecution.on('taskExecution.end', endSpy);
      taskExecution.on('taskExecution.error', errorSpy);
      taskExecution.on('taskExecution.start', startSpy);

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(1500);

      // then
      expect(cancelSpy).to.not.have.been.called;
      expect(endSpy).to.have.been.calledOnce;
      expect(errorSpy).to.not.have.been.called;
      expect(startSpy).to.have.been.calledOnce;
      expect(api.deploy).to.have.been.calledOnce;
      expect(api.startInstance).to.have.been.calledOnce;
      expect(api.getProcessInstance).to.have.been.calledOnce;
      expect(api.getProcessInstanceVariables).to.not.have.been.called;
      expect(api.getProcessInstanceIncident).to.have.been.calledOnce;

      expect(endSpy).to.have.been.calledWithMatch({
        'success': false,
        'variables': null,
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

      const cancelSpy = sinon.spy();
      const endSpy = sinon.spy();
      const errorSpy = sinon.spy();
      const startSpy = sinon.spy();

      taskExecution.on('taskExecution.cancelled', cancelSpy);
      taskExecution.on('taskExecution.end', endSpy);
      taskExecution.on('taskExecution.error', errorSpy);
      taskExecution.on('taskExecution.start', startSpy);

      // when
      taskExecution.executeTask('ServiceTask_1', { foo: 'bar' });

      await clock.tickAsync(500);

      taskExecution.cancelTaskExecution();

      await clock.tickAsync(500);

      // then
      expect(cancelSpy).to.have.been.calledOnce;
      expect(endSpy).to.not.have.been.called;
      expect(errorSpy).to.not.have.been.called;
      expect(startSpy).to.have.been.calledOnce;
      expect(api.deploy).to.have.been.calledOnce;
      expect(api.startInstance).to.have.been.calledOnce;
      expect(api.getProcessInstance).to.not.have.been.called;
      expect(api.getProcessInstanceVariables).to.not.have.been.called;
      expect(api.getProcessInstanceIncident).to.not.have.been.called;
    });


    it('should noop when cancelling without running task execution', async function() {

      // given
      const cancelSpy = sinon.spy();
      const endSpy = sinon.spy();
      const errorSpy = sinon.spy();
      const startSpy = sinon.spy();

      taskExecution.on('taskExecution.cancelled', cancelSpy);
      taskExecution.on('taskExecution.end', endSpy);
      taskExecution.on('taskExecution.error', errorSpy);
      taskExecution.on('taskExecution.start', startSpy);

      // when
      taskExecution.cancelTaskExecution();

      await clock.tickAsync(500);

      // then
      expect(cancelSpy).to.not.have.been.called;
      expect(endSpy).to.not.have.been.called;
      expect(errorSpy).to.not.have.been.called;
      expect(startSpy).to.not.have.been.called;
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