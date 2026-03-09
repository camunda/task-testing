import sinon from 'sinon';

import { bootstrapModeler, inject } from './helpers/modeler';
import {
  createCreateProcessInstanceSDKResponse,
  createDeployResponse,
  createDeployResourcesSDKResponse,
  createElementInstanceDetails,
  createEmptyGetProcessInstanceJobsResponse,
  createEmptyGetProcessInstanceMessageSubscriptionsResponse,
  createEmptyGetProcessInstanceResponse,
  createEmptyGetProcessInstanceUserTasksResponse,
  createGetProcessInstanceElementInstancesResponse,
  createGetProcessInstanceIncidentResponse,
  createGetProcessInstanceJobsResponse,
  createGetProcessInstanceResponse,
  createGetProcessInstanceVariablesResponse,
  createProcessInstanceDetails,
  createSearchElementInstancesSDKResponse,
  createSearchIncidentSDKResponse,
  createSearchProcessInstancesSDKResponse,
  createStartInstanceResponse,
  DEFAULT_DEPLOY_ERROR,
  DEFAULT_INCIDENT,
  DEFAULT_INCIDENT_KEY,
  DEFAULT_PROCESS_DEFINITION_KEY,
  DEFAULT_PROCESS_INSTANCE_KEY,
  DEFAULT_START_INSTANCE_ERROR
} from './helpers/responses';

import TaskExecution, {
  getElementInstance,
  getIncident,
  getProcessDefinitionKey,
  POLL_INTERVAL_MS,
  TASK_EXECUTION_EVENT,
  TASK_EXECUTION_FINISHED_REASON
} from '../lib/TaskExecution';

import { createDeferred } from './helpers/deferred';

import diagramXML from './fixtures/diagram.bpmn';

describe('TaskExecution', function() {

  let clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
  });

  afterEach(function() {
    clock.restore();
  });

  beforeEach(bootstrapModeler(diagramXML));

  let api, taskExecution;

  const stateChangedSpy = sinon.spy();
  const deployedSpy = sinon.spy();
  const instanceStartedSpy = sinon.spy();
  const polledSpy = sinon.spy();
  const finishedSpy = sinon.spy();

  beforeEach(inject(function(injector) {
    api = {
      deploy: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstance: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstanceElementInstances: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstanceIncident: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstanceJobs: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstanceMessageSubscriptions: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstanceUserTasks: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      getProcessInstanceVariables: sinon.stub().resolves({ success: false, error: 'Not implemented' }),
      startInstance: sinon.stub().resolves({ success: false, error: 'Not implemented' })
    };

    taskExecution = new TaskExecution(injector, api);

    taskExecution.on(TASK_EXECUTION_EVENT.STATE_CHANGED, stateChangedSpy);
    taskExecution.on(TASK_EXECUTION_EVENT.DEPLOYED, deployedSpy);
    taskExecution.on(TASK_EXECUTION_EVENT.INSTANCE_STARTED, instanceStartedSpy);
    taskExecution.on(TASK_EXECUTION_EVENT.POLLED, polledSpy);
    taskExecution.on(TASK_EXECUTION_EVENT.FINISHED, finishedSpy);
  }));

  afterEach(function() {
    taskExecution.removeAllListeners();

    stateChangedSpy.resetHistory();
    deployedSpy.resetHistory();
    instanceStartedSpy.resetHistory();
    polledSpy.resetHistory();
    finishedSpy.resetHistory();
  });


  it('should execute a task (single poll)', inject(async function(elementRegistry) {

    // given
    const deployResponse = createDeployResponse();
    const getProcessInstanceResponse = createGetProcessInstanceResponse();
    const getProcessInstanceElementInstancesResponse = createGetProcessInstanceElementInstancesResponse();
    const getProcessInstanceJobsResponse = createGetProcessInstanceJobsResponse();
    const getProcessInstanceMessageSubscriptionsResponse = createEmptyGetProcessInstanceMessageSubscriptionsResponse();
    const getProcessInstanceUserTasksResponse = createEmptyGetProcessInstanceUserTasksResponse();
    const getProcessInstanceVariablesResponse = createGetProcessInstanceVariablesResponse();
    const startInstanceResponse = createStartInstanceResponse();

    api.deploy.resolves(deployResponse);
    api.getProcessInstance.resolves(getProcessInstanceResponse);
    api.getProcessInstanceElementInstances.resolves(getProcessInstanceElementInstancesResponse);
    api.getProcessInstanceJobs.resolves(getProcessInstanceJobsResponse);
    api.getProcessInstanceMessageSubscriptions.resolves(getProcessInstanceMessageSubscriptionsResponse);
    api.getProcessInstanceUserTasks.resolves(getProcessInstanceUserTasksResponse);
    api.getProcessInstanceVariables.resolves(getProcessInstanceVariablesResponse);
    api.startInstance.resolves(startInstanceResponse);

    // when
    taskExecution.executeTask(elementRegistry.get('ServiceTask_1'), { foo: 'bar' });

    await clock.tickAsync(POLL_INTERVAL_MS);

    // then
    expect(stateChangedSpy.callCount).to.equal(4);
    expect(stateChangedSpy.getCall(0)).to.have.been.calledWith('deploying');
    expect(stateChangedSpy.getCall(1)).to.have.been.calledWith('starting-instance');
    expect(stateChangedSpy.getCall(2)).to.have.been.calledWith('executing');
    expect(stateChangedSpy.getCall(3)).to.have.been.calledWith('idle');

    expect(deployedSpy).to.have.been.calledOnce;
    expect(deployedSpy).to.have.been.calledWith(deployResponse);

    expect(instanceStartedSpy).to.have.been.calledOnce;
    expect(instanceStartedSpy).to.have.been.calledWith(startInstanceResponse);

    expect(polledSpy).to.have.been.calledOnce;
    expect(polledSpy).to.have.been.calledWithMatch({
      elementId: 'ServiceTask_1',
      processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
      elementInstancesResponse: getProcessInstanceElementInstancesResponse,
      jobsResponse: getProcessInstanceJobsResponse,
      messageSubscriptionsResponse: getProcessInstanceMessageSubscriptionsResponse,
      processInstanceResponse: getProcessInstanceResponse,
      userTasksResponse: getProcessInstanceUserTasksResponse,
      variablesResponse: getProcessInstanceVariablesResponse
    });

    expect(finishedSpy).to.have.been.calledOnce;
    expect(finishedSpy).to.have.been.calledWithMatch({
      success: true,
      processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
      lastPolledResult: {
        variablesResponse: getProcessInstanceVariablesResponse,
        elementInstancesResponse: getProcessInstanceElementInstancesResponse,
        processInstanceResponse: getProcessInstanceResponse
      }
    });

    expect(api.deploy).to.have.been.calledOnce;
    expect(api.getProcessInstance).to.have.been.calledOnce;
    expect(api.getProcessInstance).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY);
    expect(api.getProcessInstanceElementInstances).to.have.been.calledOnce;
    expect(api.getProcessInstanceElementInstances).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY);
    expect(api.getProcessInstanceIncident).to.not.have.been.called;
    expect(api.getProcessInstanceJobs).to.have.been.calledOnce;
    expect(api.getProcessInstanceJobs).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY, 'ServiceTask_1');
    expect(api.getProcessInstanceMessageSubscriptions).to.have.been.calledOnce;
    expect(api.getProcessInstanceMessageSubscriptions).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY, 'ServiceTask_1');
    expect(api.getProcessInstanceUserTasks).to.have.been.calledOnce;
    expect(api.getProcessInstanceUserTasks).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY, 'ServiceTask_1');
    expect(api.getProcessInstanceVariables).to.have.been.calledOnce;
    expect(api.getProcessInstanceVariables).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY);
    expect(api.startInstance).to.have.been.calledOnce;
    expect(api.startInstance).to.have.been.calledWithMatch(
      DEFAULT_PROCESS_DEFINITION_KEY,
      'ServiceTask_1',
      { foo: 'bar' }
    );
  }));


  it('should execute a task and poll until process instance found (2 polls)', inject(async function(elementRegistry) {

    // given
    const deployResponse = createDeployResponse();
    const emptyGetProcessInstanceResponse = createEmptyGetProcessInstanceResponse();
    const getProcessInstanceResponse = createGetProcessInstanceResponse();
    const getProcessInstanceElementInstancesResponse = createGetProcessInstanceElementInstancesResponse();
    const getProcessInstanceJobsResponse = createGetProcessInstanceJobsResponse();
    const getProcessInstanceMessageSubscriptionsResponse = createEmptyGetProcessInstanceMessageSubscriptionsResponse();
    const getProcessInstanceUserTasksResponse = createEmptyGetProcessInstanceUserTasksResponse();
    const getProcessInstanceVariablesResponse = createGetProcessInstanceVariablesResponse();
    const startInstanceResponse = createStartInstanceResponse();

    api.deploy.resolves(deployResponse);
    api.getProcessInstance.onFirstCall().resolves(emptyGetProcessInstanceResponse);
    api.getProcessInstance.onSecondCall().resolves(getProcessInstanceResponse);
    api.getProcessInstanceElementInstances.resolves(getProcessInstanceElementInstancesResponse);
    api.getProcessInstanceJobs.resolves(getProcessInstanceJobsResponse);
    api.getProcessInstanceMessageSubscriptions.resolves(getProcessInstanceMessageSubscriptionsResponse);
    api.getProcessInstanceUserTasks.resolves(getProcessInstanceUserTasksResponse);
    api.getProcessInstanceVariables.resolves(getProcessInstanceVariablesResponse);
    api.startInstance.resolves(startInstanceResponse);

    // when
    taskExecution.executeTask(elementRegistry.get('ServiceTask_1'), { foo: 'bar' });

    await clock.tickAsync(POLL_INTERVAL_MS * 2);

    // then
    expect(stateChangedSpy.callCount).to.equal(4);
    expect(stateChangedSpy.getCall(0)).to.have.been.calledWith('deploying');
    expect(stateChangedSpy.getCall(1)).to.have.been.calledWith('starting-instance');
    expect(stateChangedSpy.getCall(2)).to.have.been.calledWith('executing');
    expect(stateChangedSpy.getCall(3)).to.have.been.calledWith('idle');

    expect(deployedSpy).to.have.been.calledOnce;
    expect(deployedSpy).to.have.been.calledWith(deployResponse);

    expect(instanceStartedSpy).to.have.been.calledOnce;
    expect(instanceStartedSpy).to.have.been.calledWith(startInstanceResponse);

    expect(polledSpy).to.have.been.calledOnce;
    expect(polledSpy).to.have.been.calledWithMatch({
      elementId: 'ServiceTask_1',
      elementInstancesResponse: getProcessInstanceElementInstancesResponse,
      jobsResponse: getProcessInstanceJobsResponse,
      messageSubscriptionsResponse: getProcessInstanceMessageSubscriptionsResponse,
      processInstanceResponse: getProcessInstanceResponse,
      userTasksResponse: getProcessInstanceUserTasksResponse,
      variablesResponse: getProcessInstanceVariablesResponse
    });

    expect(finishedSpy).to.have.been.calledOnce;
    expect(finishedSpy).to.have.been.calledWithMatch({
      success: true,
      processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
      lastPolledResult: {
        variablesResponse: getProcessInstanceVariablesResponse,
        elementInstancesResponse: getProcessInstanceElementInstancesResponse,
        processInstanceResponse: getProcessInstanceResponse
      }
    });

    expect(api.deploy).to.have.been.calledOnce;
    expect(api.getProcessInstance).to.have.been.calledTwice;
    expect(api.getProcessInstance).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY);
    expect(api.getProcessInstanceElementInstances).to.have.been.calledOnce;
    expect(api.getProcessInstanceElementInstances).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY);
    expect(api.getProcessInstanceIncident).to.not.have.been.called;
    expect(api.getProcessInstanceJobs).to.have.been.calledOnce;
    expect(api.getProcessInstanceJobs).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY, 'ServiceTask_1');
    expect(api.getProcessInstanceMessageSubscriptions).to.have.been.calledOnce;
    expect(api.getProcessInstanceMessageSubscriptions).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY, 'ServiceTask_1');
    expect(api.getProcessInstanceUserTasks).to.have.been.calledOnce;
    expect(api.getProcessInstanceUserTasks).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY, 'ServiceTask_1');
    expect(api.getProcessInstanceVariables).to.have.been.calledOnce;
    expect(api.getProcessInstanceVariables).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY);
    expect(api.startInstance).to.have.been.calledOnce;
    expect(api.startInstance).to.have.been.calledWithMatch(
      DEFAULT_PROCESS_DEFINITION_KEY,
      'ServiceTask_1',
      { foo: 'bar' }
    );
  }));


  it('should execute a task and not finish if process instance is still active', inject(async function(elementRegistry) {

    // given
    const deployResponse = createDeployResponse();
    const activeProcessInstanceResponse = createGetProcessInstanceResponse({
      response: createSearchProcessInstancesSDKResponse({
        items: [ createProcessInstanceDetails({ state: 'ACTIVE', endDate: '' }) ]
      })
    });
    const getProcessInstanceElementInstancesResponse = createGetProcessInstanceElementInstancesResponse();
    const getProcessInstanceJobsResponse = createGetProcessInstanceJobsResponse();
    const getProcessInstanceMessageSubscriptionsResponse = createEmptyGetProcessInstanceMessageSubscriptionsResponse();
    const getProcessInstanceUserTasksResponse = createEmptyGetProcessInstanceUserTasksResponse();
    const getProcessInstanceVariablesResponse = createGetProcessInstanceVariablesResponse();
    const startInstanceResponse = createStartInstanceResponse();

    api.deploy.resolves(deployResponse);
    api.getProcessInstance.resolves(activeProcessInstanceResponse);
    api.getProcessInstanceElementInstances.resolves(getProcessInstanceElementInstancesResponse);
    api.getProcessInstanceJobs.resolves(getProcessInstanceJobsResponse);
    api.getProcessInstanceMessageSubscriptions.resolves(getProcessInstanceMessageSubscriptionsResponse);
    api.getProcessInstanceUserTasks.resolves(getProcessInstanceUserTasksResponse);
    api.getProcessInstanceVariables.resolves(getProcessInstanceVariablesResponse);
    api.startInstance.resolves(startInstanceResponse);

    // when
    taskExecution.executeTask(elementRegistry.get('ServiceTask_1'), { foo: 'bar' });

    await clock.tickAsync(POLL_INTERVAL_MS * 2);

    // then
    expect(stateChangedSpy.callCount).to.equal(3);
    expect(stateChangedSpy.getCall(0)).to.have.been.calledWith('deploying');
    expect(stateChangedSpy.getCall(1)).to.have.been.calledWith('starting-instance');
    expect(stateChangedSpy.getCall(2)).to.have.been.calledWith('executing');

    expect(deployedSpy).to.have.been.calledOnce;
    expect(deployedSpy).to.have.been.calledWith(deployResponse);

    expect(instanceStartedSpy).to.have.been.calledOnce;
    expect(instanceStartedSpy).to.have.been.calledWith(startInstanceResponse);

    expect(polledSpy).to.have.been.calledTwice;
    expect(polledSpy).to.have.been.calledWithMatch({
      elementId: 'ServiceTask_1',
      elementInstancesResponse: getProcessInstanceElementInstancesResponse,
      jobsResponse: getProcessInstanceJobsResponse,
      messageSubscriptionsResponse: getProcessInstanceMessageSubscriptionsResponse,
      processInstanceResponse: activeProcessInstanceResponse,
      userTasksResponse: getProcessInstanceUserTasksResponse,
      variablesResponse: getProcessInstanceVariablesResponse
    });

    expect(finishedSpy).to.not.have.been.called;

    expect(api.deploy).to.have.been.calledOnce;
    expect(api.getProcessInstance).to.have.been.calledTwice;
    expect(api.getProcessInstance).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY);
    expect(api.getProcessInstanceElementInstances).to.have.been.calledTwice;
    expect(api.getProcessInstanceElementInstances).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY);
    expect(api.getProcessInstanceIncident).to.not.have.been.called;
    expect(api.getProcessInstanceJobs).to.have.been.calledTwice;
    expect(api.getProcessInstanceJobs).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY, 'ServiceTask_1');
    expect(api.getProcessInstanceMessageSubscriptions).to.have.been.calledTwice;
    expect(api.getProcessInstanceMessageSubscriptions).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY, 'ServiceTask_1');
    expect(api.getProcessInstanceUserTasks).to.have.been.calledTwice;
    expect(api.getProcessInstanceUserTasks).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY, 'ServiceTask_1');
    expect(api.getProcessInstanceVariables).to.have.been.calledTwice;
    expect(api.getProcessInstanceVariables).to.have.been.calledWithMatch(DEFAULT_PROCESS_INSTANCE_KEY);
    expect(api.startInstance).to.have.been.calledOnce;
    expect(api.startInstance).to.have.been.calledWithMatch(
      DEFAULT_PROCESS_DEFINITION_KEY,
      'ServiceTask_1',
      { foo: 'bar' }
    );
  }));


  describe('errors', function() {

    it('should handle no process ID error (return without error)', inject(async function(elementFactory) {

      // given
      const task = elementFactory.create('shape', {
        type: 'bpmn:ServiceTask'
      });

      // when
      taskExecution.executeTask(task);

      await clock.tickAsync(POLL_INTERVAL_MS);

      // then
      expect(finishedSpy).to.not.have.been.called;
    }));


    it('should handle deploy error', inject(async function(elementRegistry) {

      // given
      api.deploy.resolves(createDeployResponse({ success: false, error: DEFAULT_DEPLOY_ERROR }));

      // when
      taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

      await clock.tickAsync(POLL_INTERVAL_MS);

      // then
      expect(stateChangedSpy).to.have.been.calledWith('deploying');
      expect(api.deploy).to.have.been.calledOnce;
      expect(api.startInstance).to.not.have.been.called;

      expect(finishedSpy).to.have.been.calledOnce;
      expect(finishedSpy).to.have.been.calledWithMatch({
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.ERROR,
        error: {
          message: 'Failed to deploy process definition',
          response: DEFAULT_DEPLOY_ERROR
        },
        processInstanceKey: null,
        lastPolledResult: null
      });
    }));


    it('should handle start instance error', inject(async function(elementRegistry) {

      // given
      api.deploy.resolves(createDeployResponse());
      api.startInstance.resolves(createStartInstanceResponse({ success: false, error: DEFAULT_START_INSTANCE_ERROR }));

      // when
      taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

      await clock.tickAsync(POLL_INTERVAL_MS);

      // then
      expect(stateChangedSpy).to.have.been.calledWith('starting-instance');
      expect(api.startInstance).to.have.been.calledOnce;

      expect(finishedSpy).to.have.been.calledOnce;
      expect(finishedSpy).to.have.been.calledWithMatch({
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.ERROR,
        error: {
          message: 'Failed to start process instance',
          response: DEFAULT_START_INSTANCE_ERROR
        },
        processInstanceKey: null,
        lastPolledResult: null
      });
    }));


    it('should handle no process instance key error', inject(async function(elementRegistry) {

      // given
      api.deploy.resolves(createDeployResponse());
      api.startInstance.resolves(createStartInstanceResponse({ response: createCreateProcessInstanceSDKResponse({
        processInstanceKey: null
      }) }));

      // when
      taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

      await clock.tickAsync(POLL_INTERVAL_MS);

      // then
      expect(stateChangedSpy).to.have.been.calledWith('starting-instance');
      expect(api.startInstance).to.have.been.calledOnce;

      expect(finishedSpy).to.have.been.calledOnce;
      expect(finishedSpy).to.have.been.calledWithMatch({
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.ERROR,
        error: {
          message: 'Failed to retrieve process instance key from start instance response'
        },
        processInstanceKey: null,
        lastPolledResult: null
      });
    }));

  });


  describe('incidents', function() {

    it('should handle incident', inject(async function(elementRegistry) {

      // given
      const incidentProcessInstanceResponse = createGetProcessInstanceResponse({
        response: createSearchProcessInstancesSDKResponse({
          items: [ createProcessInstanceDetails({ state: 'ACTIVE', hasIncident: true, endDate: null }) ]
        })
      });

      api.deploy.resolves(createDeployResponse());
      api.getProcessInstance.resolves(incidentProcessInstanceResponse);
      api.getProcessInstanceElementInstances.resolves(createGetProcessInstanceElementInstancesResponse());
      api.getProcessInstanceIncident.resolves(createGetProcessInstanceIncidentResponse());
      api.getProcessInstanceJobs.resolves(createEmptyGetProcessInstanceJobsResponse());
      api.getProcessInstanceMessageSubscriptions.resolves(createEmptyGetProcessInstanceMessageSubscriptionsResponse());
      api.getProcessInstanceUserTasks.resolves(createEmptyGetProcessInstanceUserTasksResponse());
      api.getProcessInstanceVariables.resolves(createGetProcessInstanceVariablesResponse());
      api.startInstance.resolves(createStartInstanceResponse());

      // when
      taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

      await clock.tickAsync(POLL_INTERVAL_MS);

      // then
      expect(finishedSpy).to.have.been.calledOnce;
      expect(finishedSpy).to.have.been.calledWithMatch({
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.INCIDENT,
        incident: DEFAULT_INCIDENT
      });
    }));

  });


  describe('cancellation', function() {

    describe('cancellation reasons', function() {

      it('should cancel with user cancellation reason', inject(async function(elementRegistry) {

        // given
        const deferred = createDeferred();

        api.deploy.resolves(createDeployResponse());
        api.getProcessInstance.returns(deferred.promise);
        api.startInstance.resolves(createStartInstanceResponse());

        // when
        taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

        await clock.tickAsync(POLL_INTERVAL_MS);

        // assume
        expect(stateChangedSpy).to.have.been.calledWith('executing');
        expect(api.getProcessInstance).to.have.been.calledOnce;

        // when
        taskExecution.cancelTaskExecution();

        deferred.resolve(createGetProcessInstanceResponse());

        await clock.tickAsync(0);

        // then
        expect(stateChangedSpy.callCount).to.equal(4);
        expect(stateChangedSpy.getCall(0)).to.have.been.calledWith('deploying');
        expect(stateChangedSpy.getCall(1)).to.have.been.calledWith('starting-instance');
        expect(stateChangedSpy.getCall(2)).to.have.been.calledWith('executing');
        expect(stateChangedSpy.getCall(3)).to.have.been.calledWith('idle');

        expect(finishedSpy).to.have.been.calledOnce;
        expect(finishedSpy).to.have.been.calledWithMatch({
          success: false,
          reason: TASK_EXECUTION_FINISHED_REASON.USER_CANCEL,
          processInstanceKey: null,
          lastPolledResult: null
        });
      }));


      it('should cancel with user selection changed reason on <selection.changed>', inject(async function(elementRegistry, selection) {

        // given
        const deferred = createDeferred();

        api.deploy.resolves(createDeployResponse());
        api.getProcessInstance.returns(deferred.promise);
        api.startInstance.resolves(createStartInstanceResponse());

        taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

        await clock.tickAsync(POLL_INTERVAL_MS);

        // assume
        expect(stateChangedSpy).to.have.been.calledWith('executing');
        expect(api.getProcessInstance).to.have.been.calledOnce;

        // when
        selection.select(elementRegistry.get('StartEvent_1'));

        deferred.resolve(createGetProcessInstanceResponse());

        await clock.tickAsync(0);

        // then
        expect(stateChangedSpy.callCount).to.equal(4);
        expect(stateChangedSpy.getCall(0)).to.have.been.calledWith('deploying');
        expect(stateChangedSpy.getCall(1)).to.have.been.calledWith('starting-instance');
        expect(stateChangedSpy.getCall(2)).to.have.been.calledWith('executing');
        expect(stateChangedSpy.getCall(3)).to.have.been.calledWith('idle');

        expect(finishedSpy).to.have.been.calledOnce;
        expect(finishedSpy).to.have.been.calledWithMatch({
          success: false,
          reason: TASK_EXECUTION_FINISHED_REASON.USER_SELECTION_CHANGED,
          processInstanceKey: null,
          lastPolledResult: null
        });
      }));

    });


    describe('cancellation timing', function() {

      it('should cancel during deploy', inject(async function(elementRegistry) {

        // given
        const deferred = createDeferred();

        api.deploy.returns(deferred.promise);

        // when
        taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

        await clock.tickAsync(0);

        // assume
        expect(api.deploy).to.have.been.calledOnce;
        expect(stateChangedSpy).to.have.been.calledWith('deploying');

        // when
        taskExecution.cancelTaskExecution();

        deferred.resolve(createDeployResponse());

        await clock.tickAsync(0);

        // then
        expect(stateChangedSpy).to.have.been.calledWith('idle');
        expect(finishedSpy).to.have.been.calledOnce;
        expect(finishedSpy).to.have.been.calledWithMatch({
          success: false,
          reason: TASK_EXECUTION_FINISHED_REASON.USER_CANCEL,
          processInstanceKey: null,
          lastPolledResult: null
        });
        expect(api.startInstance).to.not.have.been.called;
      }));


      it('should cancel during startInstance', inject(async function(elementRegistry) {

        // given
        const deferred = createDeferred();

        api.deploy.resolves(createDeployResponse());
        api.startInstance.returns(deferred.promise);

        // when
        taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

        await clock.tickAsync(0);

        // assume
        expect(api.startInstance).to.have.been.calledOnce;
        expect(stateChangedSpy).to.have.been.calledWith('starting-instance');

        // when
        taskExecution.cancelTaskExecution();

        deferred.resolve(createStartInstanceResponse());

        await clock.tickAsync(0);

        // then
        expect(stateChangedSpy).to.have.been.calledWith('idle');
        expect(finishedSpy).to.have.been.calledOnce;
        expect(finishedSpy).to.have.been.calledWithMatch({
          success: false,
          reason: TASK_EXECUTION_FINISHED_REASON.USER_CANCEL,
          processInstanceKey: null,
          lastPolledResult: null
        });
        expect(api.getProcessInstance).to.not.have.been.called;
      }));


      it('should cancel during getProcessInstance (polling interval)', inject(async function(elementRegistry) {

        // given
        const deferred = createDeferred();

        api.deploy.resolves(createDeployResponse());
        api.getProcessInstance.returns(deferred.promise);
        api.startInstance.resolves(createStartInstanceResponse());

        // when
        taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

        await clock.tickAsync(POLL_INTERVAL_MS);

        // assume
        expect(api.getProcessInstance).to.have.been.calledOnce;
        expect(stateChangedSpy).to.have.been.calledWith('executing');

        // when
        taskExecution.cancelTaskExecution();

        deferred.resolve(createGetProcessInstanceResponse());

        await clock.tickAsync(0);

        // then
        expect(stateChangedSpy).to.have.been.calledWith('idle');
        expect(finishedSpy).to.have.been.calledOnce;
        expect(finishedSpy).to.have.been.calledWithMatch({
          success: false,
          reason: TASK_EXECUTION_FINISHED_REASON.USER_CANCEL,
          processInstanceKey: null,
          lastPolledResult: null
        });
        expect(api.getProcessInstanceElementInstances).to.not.have.been.called;
      }));


      it('should cancel during getProcessInstanceElementInstances (polling interval)', inject(async function(elementRegistry) {

        // given
        const deferred = createDeferred();

        api.deploy.resolves(createDeployResponse());
        api.getProcessInstance.returns(createGetProcessInstanceResponse());
        api.getProcessInstanceElementInstances.returns(deferred.promise);
        api.getProcessInstanceJobs.resolves(createGetProcessInstanceJobsResponse());
        api.getProcessInstanceMessageSubscriptions.resolves(createEmptyGetProcessInstanceMessageSubscriptionsResponse());
        api.getProcessInstanceUserTasks.resolves(createEmptyGetProcessInstanceUserTasksResponse());
        api.getProcessInstanceVariables.resolves(createGetProcessInstanceVariablesResponse());
        api.startInstance.resolves(createStartInstanceResponse());

        // when
        taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

        await clock.tickAsync(POLL_INTERVAL_MS);

        // assume
        expect(api.getProcessInstanceElementInstances).to.have.been.calledOnce;
        expect(stateChangedSpy).to.have.been.calledWith('executing');

        // when
        taskExecution.cancelTaskExecution();

        deferred.resolve(createGetProcessInstanceElementInstancesResponse());

        await clock.tickAsync(0);

        // then
        expect(stateChangedSpy).to.have.been.calledWith('idle');
        expect(finishedSpy).to.have.been.calledOnce;
        expect(finishedSpy).to.have.been.calledWithMatch({
          success: false,
          reason: TASK_EXECUTION_FINISHED_REASON.USER_CANCEL,
          processInstanceKey: null,
          lastPolledResult: null
        });
      }));


      it('should cancel during getProcessInstanceIncident (polling interval)', inject(async function(elementRegistry) {

        // given
        const deferred = createDeferred();

        const incidentProcessInstanceResponse = createGetProcessInstanceResponse({
          response: createSearchProcessInstancesSDKResponse({
            items: [ createProcessInstanceDetails({ state: 'ACTIVE', hasIncident: true, endDate: null }) ]
          })
        });

        api.deploy.resolves(createDeployResponse());
        api.getProcessInstance.resolves(incidentProcessInstanceResponse);
        api.getProcessInstanceElementInstances.resolves(createGetProcessInstanceElementInstancesResponse());
        api.getProcessInstanceIncident.returns(deferred.promise);
        api.getProcessInstanceJobs.resolves(createGetProcessInstanceJobsResponse());
        api.getProcessInstanceMessageSubscriptions.resolves(createEmptyGetProcessInstanceMessageSubscriptionsResponse());
        api.getProcessInstanceUserTasks.resolves(createEmptyGetProcessInstanceUserTasksResponse());
        api.getProcessInstanceVariables.resolves(createGetProcessInstanceVariablesResponse());
        api.startInstance.resolves(createStartInstanceResponse());

        // when
        taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

        await clock.tickAsync(POLL_INTERVAL_MS);

        // assume
        expect(api.getProcessInstanceIncident).to.have.been.calledOnce;
        expect(polledSpy).to.have.been.calledOnce;

        // when
        taskExecution.cancelTaskExecution();

        deferred.resolve(createGetProcessInstanceIncidentResponse());

        await clock.tickAsync(0);

        // then
        expect(stateChangedSpy).to.have.been.calledWith('idle');
        expect(finishedSpy).to.have.been.calledOnce;
        expect(finishedSpy).to.have.been.calledWithMatch({
          success: false,
          reason: TASK_EXECUTION_FINISHED_REASON.USER_CANCEL
        });

        const { lastPolledResult } = finishedSpy.getCall(0).args[0];

        expect(lastPolledResult).to.exist;
        expect(lastPolledResult.elementId).to.equal('ServiceTask_1');
      }));

    });


    it('should not cancel if idle', async function() {

      // when
      taskExecution.cancelTaskExecution();

      await clock.tickAsync(500);

      // then
      expect(finishedSpy).to.not.have.been.called;
    });

  });


  describe('stale execution', function() {

    it('should ignore stale getProcessInstance response after cancel', inject(async function(elementRegistry) {

      // given
      const deferred = createDeferred();

      api.deploy.resolves(createDeployResponse());
      api.startInstance.resolves(createStartInstanceResponse());
      api.getProcessInstance.returns(deferred.promise);
      api.getProcessInstanceElementInstances.resolves(createGetProcessInstanceElementInstancesResponse());
      api.getProcessInstanceJobs.resolves(createGetProcessInstanceJobsResponse());
      api.getProcessInstanceMessageSubscriptions.resolves(createEmptyGetProcessInstanceMessageSubscriptionsResponse());
      api.getProcessInstanceUserTasks.resolves(createEmptyGetProcessInstanceUserTasksResponse());
      api.getProcessInstanceVariables.resolves(createGetProcessInstanceVariablesResponse());

      taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

      await clock.tickAsync(POLL_INTERVAL_MS);

      // assume
      expect(api.getProcessInstance).to.have.been.calledOnce;

      // when
      taskExecution.cancelTaskExecution();

      deferred.resolve(createGetProcessInstanceResponse());

      await clock.tickAsync(0);

      // then - stale response should not trigger polled event
      expect(polledSpy).to.not.have.been.called;

      // finished should be called exactly once (from cancel, not from stale completion)
      expect(finishedSpy).to.have.been.calledOnce;
      expect(finishedSpy).to.have.been.calledWithMatch({
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.USER_CANCEL
      });
    }));


    it('should ignore stale Promise.all response after cancel', inject(async function(elementRegistry) {

      // given
      const deferred = createDeferred();

      api.deploy.resolves(createDeployResponse());
      api.startInstance.resolves(createStartInstanceResponse());
      api.getProcessInstance.resolves(createGetProcessInstanceResponse());
      api.getProcessInstanceElementInstances.returns(deferred.promise);
      api.getProcessInstanceJobs.resolves(createGetProcessInstanceJobsResponse());
      api.getProcessInstanceMessageSubscriptions.resolves(createEmptyGetProcessInstanceMessageSubscriptionsResponse());
      api.getProcessInstanceUserTasks.resolves(createEmptyGetProcessInstanceUserTasksResponse());
      api.getProcessInstanceVariables.resolves(createGetProcessInstanceVariablesResponse());

      taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

      await clock.tickAsync(POLL_INTERVAL_MS);

      // assume - getProcessInstance resolved, Promise.all in-flight
      expect(api.getProcessInstanceElementInstances).to.have.been.calledOnce;

      // when
      taskExecution.cancelTaskExecution();

      deferred.resolve(createGetProcessInstanceElementInstancesResponse());

      await clock.tickAsync(0);

      // then - stale Promise.all response should not trigger polled event
      expect(polledSpy).to.not.have.been.called;

      expect(finishedSpy).to.have.been.calledOnce;
      expect(finishedSpy).to.have.been.calledWithMatch({
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.USER_CANCEL
      });
    }));


    it('should ignore stale response when new execution starts', inject(async function(elementRegistry) {

      // given
      const deferred = createDeferred();

      api.deploy.resolves(createDeployResponse());
      api.startInstance.resolves(createStartInstanceResponse());
      api.getProcessInstance.returns(deferred.promise);
      api.getProcessInstanceElementInstances.resolves(createGetProcessInstanceElementInstancesResponse());
      api.getProcessInstanceJobs.resolves(createGetProcessInstanceJobsResponse());
      api.getProcessInstanceMessageSubscriptions.resolves(createEmptyGetProcessInstanceMessageSubscriptionsResponse());
      api.getProcessInstanceUserTasks.resolves(createEmptyGetProcessInstanceUserTasksResponse());
      api.getProcessInstanceVariables.resolves(createGetProcessInstanceVariablesResponse());

      // start execution A
      taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

      await clock.tickAsync(POLL_INTERVAL_MS);

      // assume - execution A's getProcessInstance is in-flight
      expect(api.getProcessInstance).to.have.been.calledOnce;

      // reset spies so we can observe execution B cleanly
      finishedSpy.resetHistory();
      stateChangedSpy.resetHistory();
      polledSpy.resetHistory();

      // when - start execution B (supersedes A)
      taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

      // resolve execution A's deferred
      deferred.resolve(createGetProcessInstanceResponse());

      await clock.tickAsync(0);

      // then - execution A's stale response should not trigger polled
      expect(polledSpy).to.not.have.been.called;

      // execution B should be in deploying state
      expect(stateChangedSpy).to.have.been.calledWith('deploying');
    }));


    it('should ignore stale getProcessInstanceIncident response after cancel', inject(async function(elementRegistry) {

      // given
      const deferred = createDeferred();

      const incidentProcessInstanceResponse = createGetProcessInstanceResponse({
        response: createSearchProcessInstancesSDKResponse({
          items: [ createProcessInstanceDetails({ state: 'ACTIVE', hasIncident: true, endDate: null }) ]
        })
      });

      api.deploy.resolves(createDeployResponse());
      api.startInstance.resolves(createStartInstanceResponse());
      api.getProcessInstance.resolves(incidentProcessInstanceResponse);
      api.getProcessInstanceElementInstances.resolves(createGetProcessInstanceElementInstancesResponse());
      api.getProcessInstanceIncident.returns(deferred.promise);
      api.getProcessInstanceJobs.resolves(createGetProcessInstanceJobsResponse());
      api.getProcessInstanceMessageSubscriptions.resolves(createEmptyGetProcessInstanceMessageSubscriptionsResponse());
      api.getProcessInstanceUserTasks.resolves(createEmptyGetProcessInstanceUserTasksResponse());
      api.getProcessInstanceVariables.resolves(createGetProcessInstanceVariablesResponse());

      taskExecution.executeTask(elementRegistry.get('ServiceTask_1'));

      await clock.tickAsync(POLL_INTERVAL_MS);

      // assume - polled event fired, incident fetch is in-flight
      expect(polledSpy).to.have.been.calledOnce;
      expect(api.getProcessInstanceIncident).to.have.been.calledOnce;

      // when
      taskExecution.cancelTaskExecution();

      deferred.resolve(createGetProcessInstanceIncidentResponse());

      await clock.tickAsync(0);

      // then - should not emit finished with incident reason (only with cancel reason)
      expect(finishedSpy).to.have.been.calledOnce;
      expect(finishedSpy).to.have.been.calledWithMatch({
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.USER_CANCEL
      });
    }));

  });


  describe('termination', function() {

    it('should finish with termination reason if process instance and task are both terminated', inject(async function(elementRegistry) {

      // given
      const deployResponse = createDeployResponse();
      const terminatedProcessInstanceResponse = createGetProcessInstanceResponse({
        response: createSearchProcessInstancesSDKResponse({
          items: [ createProcessInstanceDetails({ state: 'TERMINATED' }) ]
        })
      });
      const terminatedElementInstancesResponse = createGetProcessInstanceElementInstancesResponse({
        response: createSearchElementInstancesSDKResponse({
          items: [ createElementInstanceDetails({ state: 'TERMINATED' }) ]
        })
      });
      const getProcessInstanceJobsResponse = createGetProcessInstanceJobsResponse();
      const getProcessInstanceMessageSubscriptionsResponse = createEmptyGetProcessInstanceMessageSubscriptionsResponse();
      const getProcessInstanceUserTasksResponse = createEmptyGetProcessInstanceUserTasksResponse();
      const getProcessInstanceVariablesResponse = createGetProcessInstanceVariablesResponse();
      const startInstanceResponse = createStartInstanceResponse();

      api.deploy.resolves(deployResponse);
      api.getProcessInstance.resolves(terminatedProcessInstanceResponse);
      api.getProcessInstanceElementInstances.resolves(terminatedElementInstancesResponse);
      api.getProcessInstanceJobs.resolves(getProcessInstanceJobsResponse);
      api.getProcessInstanceMessageSubscriptions.resolves(getProcessInstanceMessageSubscriptionsResponse);
      api.getProcessInstanceUserTasks.resolves(getProcessInstanceUserTasksResponse);
      api.getProcessInstanceVariables.resolves(getProcessInstanceVariablesResponse);
      api.startInstance.resolves(startInstanceResponse);

      // when
      taskExecution.executeTask(elementRegistry.get('ServiceTask_1'), { foo: 'bar' });

      await clock.tickAsync(POLL_INTERVAL_MS);

      // then
      expect(finishedSpy).to.have.been.calledOnce;
      expect(finishedSpy).to.have.been.calledWithMatch({
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.TERMINATED,
        processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
        lastPolledResult: {
          elementInstancesResponse: terminatedElementInstancesResponse,
          processInstanceResponse: terminatedProcessInstanceResponse,
          variablesResponse: getProcessInstanceVariablesResponse
        }
      });
    }));

  });


  describe('#getProcessDefinitionKey', function() {

    it('should get process definition key from deploy response', function() {

      // when
      const processDefinitionKey = getProcessDefinitionKey(
        createDeployResourcesSDKResponse(),
        'Process_1'
      );

      // then
      expect(processDefinitionKey).to.equal(DEFAULT_PROCESS_DEFINITION_KEY);
    });


    it('should return null if process definition with ID not found', function() {

      // when
      const processDefinitionKey = getProcessDefinitionKey(
        createDeployResourcesSDKResponse(),
        'Process_2'
      );

      // then
      expect(processDefinitionKey).to.be.null;
    });


    it('should return null if no process definition found', function() {

      // when
      const processDefinitionKey = getProcessDefinitionKey(
        createDeployResourcesSDKResponse({
          deployments: [],
          processes: []
        }),
        'Process_1'
      );

      // then
      expect(processDefinitionKey).to.be.null;
    });

  });


  describe('#getIncident', function() {

    it('should get incident from response', function() {

      // given
      const response = createSearchIncidentSDKResponse();

      // when
      const incident = getIncident(response);

      // then
      expect(incident).to.exist;
      expect(incident.incidentKey).to.equal(DEFAULT_INCIDENT_KEY);
    });


    it('should return null if no incident found', function() {

      // given
      const response = createSearchIncidentSDKResponse({
        items: []
      });

      // when
      const incident = getIncident(response);

      // then
      expect(incident).to.be.null;
    });

  });


  describe('#getElementInstance', function() {

    it('should get element instance from response', inject(async function(elementRegistry) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const response = createSearchElementInstancesSDKResponse();

      // when
      const elementInstance = getElementInstance(response, element);

      // then
      expect(elementInstance).to.exist;
      expect(elementInstance.elementId).to.equal('ServiceTask_1');
    }));


    it('should return null if element instance not found', inject(async function(elementRegistry) {

      // given
      const element = elementRegistry.get('ServiceTask_1');

      const response = createSearchElementInstancesSDKResponse({
        items: [
          createElementInstanceDetails({ elementId: 'ServiceTask_2' })
        ]
      });

      // when
      const elementInstance = getElementInstance(response, element);

      // then
      expect(elementInstance).to.be.null;
    }));

  });

});