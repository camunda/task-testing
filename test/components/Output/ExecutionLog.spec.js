import React from 'react';

import { render, fireEvent } from '@testing-library/react';

import {
  ExecutionLog
} from '../../../lib/components/Output/ExecutionLog';

import {
  createJobEntry,
  EXECUTION_LOG_ENTRY_STATUS,
  EXECUTION_LOG_ENTRY_TYPE
} from '../../../lib/ExecutionLog';

import {
  createMockDate,
  ONE_SECOND_MS,
  ONE_MINUTE_MS,
  createJobDetails,
  createMockTimestamp
} from '../../helpers/responses';


describe('ExecutionLog', function() {

  describe('empty state', function() {

    it('should render empty message when entries is empty', function() {

      // when
      const { container } = renderExecutionLog({ entries: [] });

      // then
      expect(container.querySelector('.execution-log__empty')).to.exist;
      expect(container.textContent).to.include('No log entries yet');
    });

  });


  describe('status entries', function() {

    it('should render deploying status', function() {

      // given
      const entries = [
        createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.DEPLOYING)
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Deploying process')).to.exist;
    });


    it('should render deployed status', function() {

      // given
      const entries = [
        createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.DEPLOYED, {
          processDefinitionId: 'Process_1',
          processDefinitionKey: '2',
          processDefinitionVersion: 1,
          deploymentKey: '1'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Process deployed')).to.exist;
    });


    it('should render starting-instance status', function() {

      // given
      const entries = [
        createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.STARTING_INSTANCE)
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Starting process instance')).to.exist;
    });


    it('should render instance-started status', function() {

      // given
      const entries = [
        createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED, {
          processInstanceKey: '3',
          processDefinitionId: 'Process_1',
          processDefinitionKey: '2'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Process instance started')).to.exist;
    });


    it('should render completed status', function() {

      // given
      const entries = [
        createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.COMPLETED, {
          processInstanceKey: '3'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Process instance completed')).to.exist;
    });


    it('should render terminated status', function() {

      // given
      const entries = [
        createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.TERMINATED, {
          processInstanceKey: '3'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Process instance terminated')).to.exist;
    });


    it('should render incident status', function() {

      // given
      const entries = [
        createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.INCIDENT, {
          processInstanceKey: '3',
          errorType: 'JOB_NO_RETRIES',
          errorMessage: 'Foo'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Incident')).to.exist;
    });


    it('should render canceled status', function() {

      // given
      const entries = [
        createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.CANCELED)
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Test canceled')).to.exist;
    });


    it('should NOT render entry for executing status', function() {

      // given
      const entries = [
        createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.EXECUTING)
      ];

      // when
      const { container } = renderExecutionLog({ entries });

      // then
      const wrappers = container.querySelectorAll('.execution-log__entry-wrapper');
      expect(wrappers).to.have.length(0);
    });


    describe('status details', function() {

      it('should expand deployed status to show details', function() {

        // given
        const entries = [
          createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.DEPLOYED, {
            processDefinitionId: 'Process_1',
            processDefinitionKey: '3',
            processDefinitionVersion: 1,
            deploymentKey: '2'
          })
        ];

        const { queryByText, container } = renderExecutionLog({ entries });

        // when
        fireEvent.click(container.querySelector('.execution-log__entry--expandable'));

        // then
        expect(queryByText('Process')).to.exist;
        expect(queryByText('Process_1')).to.exist;
        expect(queryByText('Definition Key')).to.exist;
        expect(queryByText('Version')).to.exist;
        expect(queryByText('1')).to.exist;
        expect(queryByText('Deployment Key')).to.exist;
        expect(queryByText('2')).to.exist;
      });


      it('should expand instance-started status to show details', function() {

        // given
        const entries = [
          createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED, {
            processInstanceKey: '2',
            processDefinitionId: 'Process_1',
            processDefinitionKey: '1'
          })
        ];

        const { queryByText, container } = renderExecutionLog({ entries });

        // when
        fireEvent.click(container.querySelector('.execution-log__entry--expandable'));

        // then
        expect(queryByText('Instance Key')).to.exist;
        expect(queryByText('2')).to.exist;
      });


      it('should expand completed status to show details', function() {

        // given
        const entries = [
          createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.COMPLETED, {
            processInstanceKey: '1'
          })
        ];

        const { queryByText, container } = renderExecutionLog({ entries });

        // when
        fireEvent.click(container.querySelector('.execution-log__entry--expandable'));

        // then
        expect(queryByText('Instance Key')).to.exist;
        expect(queryByText('1')).to.exist;
      });


      it('should expand incident status to show error details', function() {

        // given
        const entries = [
          createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.INCIDENT, {
            processInstanceKey: '1',
            errorType: 'JOB_NO_RETRIES',
            errorMessage: 'Foo'
          })
        ];

        const { queryByText, container } = renderExecutionLog({ entries });

        // when
        fireEvent.click(container.querySelector('.execution-log__entry--expandable'));

        // then
        expect(queryByText('Error Type')).to.exist;
        expect(queryByText('JOB_NO_RETRIES')).to.exist;
        expect(queryByText('Error')).to.exist;
        expect(queryByText('Foo')).to.exist;
      });


      it('should collapse details when clicked again', function() {

        // given
        const entries = [
          createStatusEntry(EXECUTION_LOG_ENTRY_STATUS.DEPLOYED, {
            processDefinitionId: 'Process_1',
            processDefinitionKey: '2',
            processDefinitionVersion: 1,
            deploymentKey: '1'
          })
        ];

        const { queryByText, container } = renderExecutionLog({ entries });

        // when - expand
        fireEvent.click(container.querySelector('.execution-log__entry--expandable'));

        expect(queryByText('Deployment Key')).to.exist;

        // when - collapse
        fireEvent.click(container.querySelector('.execution-log__entry--expandable'));

        // then
        expect(queryByText('Deployment Key')).to.not.exist;
      });


      it('should NOT be expandable for status without details', function() {

        // given
        const entries = [
          createStatusEntry('deploying')
        ];

        // when
        const { container } = renderExecutionLog({ entries });

        // then
        expect(container.querySelector('.execution-log__entry--expandable')).to.not.exist;
      });

    });

  });


  describe('job entries', function() {

    it('it should render label', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), { state: 'CREATED' })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Job created')).to.exist;
    });


    it('should render secondary label with job type', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'COMPLETED',
          type: 'io.camunda:http-json:1'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('io.camunda:http-json:1')).to.exist;
    });


    it('should show job duration for completed job', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'COMPLETED',
          creationTime: createMockDate(),
          endTime: createMockDate(ONE_SECOND_MS * 5)
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('5.0s')).to.exist;
    });


    it('should show job duration for failed job', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'FAILED',
          creationTime: createMockDate(),
          endTime: createMockDate(ONE_SECOND_MS * 0.5)
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('500ms')).to.exist;
    });


    it('should expand job entry to show details', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'COMPLETED',
          type: 'foo',
          elementId: 'ServiceTask_1',
          jobKey: '1'
        })
      ];

      const { container } = renderExecutionLog({ entries });

      // when
      fireEvent.click(container.querySelector('.execution-log__entry--expandable'));

      // then
      const details = container.querySelector('.execution-log__details');

      expect(details).to.exist;
      expect(details.textContent).to.include('Type');
      expect(details.textContent).to.include('foo');
      expect(details.textContent).to.include('Element');
      expect(details.textContent).to.include('ServiceTask_1');
      expect(details.textContent).to.include('State');
      expect(details.textContent).to.include('Job Key');
      expect(details.textContent).to.include('1');
    });


    it('should show execution listener kind in details', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'COMPLETED',
          kind: 'EXECUTION_LISTENER',
          listenerEventType: 'START'
        })
      ];

      const { queryByText, container } = renderExecutionLog({ entries });

      // when
      fireEvent.click(container.querySelector('.execution-log__entry--expandable'));

      // then
      expect(queryByText('Kind')).to.exist;
      expect(queryByText('Start execution listener')).to.exist;
    });


    it('should mark pending job as active when executing', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'CREATED'
        })
      ];

      // when
      const { container } = renderExecutionLog({ entries, isTaskExecuting: true });

      // then
      expect(container.querySelector('.execution-log__entry-wrapper--active')).to.exist;
    });


    it('should NOT mark completed job as active', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'COMPLETED'
        })
      ];

      // when
      const { container } = renderExecutionLog({ entries, isTaskExecuting: true });

      // then
      expect(container.querySelector('.execution-log__entry-wrapper--active')).to.not.exist;
    });


    it('should NOT mark failed job as active', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'FAILED'
        })
      ];

      // when
      const { container } = renderExecutionLog({ entries, isTaskExecuting: true });

      // then
      expect(container.querySelector('.execution-log__entry-wrapper--active')).to.not.exist;
    });

  });


  describe('user task entries', function() {

    it('should render user task created label', function() {

      // given
      const entries = [
        createUserTaskEntry({
          state: 'CREATED'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('User task created')).to.exist;
    });


    it('should render user task completed label', function() {

      // given
      const entries = [
        createUserTaskEntry({
          state: 'COMPLETED'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('User task completed')).to.exist;
    });


    it('should render user task canceled label', function() {

      // given
      const entries = [
        createUserTaskEntry({
          state: 'CANCELED'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('User task canceled')).to.exist;
    });


    it('should render secondary label with task name', function() {

      // given
      const entries = [
        createUserTaskEntry({
          state: 'CREATED',
          name: 'Foo'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Foo')).to.exist;
    });


    it('should show user task duration for completed task', function() {

      // given
      const entries = [
        createUserTaskEntry({
          state: 'COMPLETED',
          creationDate: createMockDate(0),
          completionDate: createMockDate(ONE_MINUTE_MS * 2 + ONE_SECOND_MS * 30)
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('2m 30s')).to.exist;
    });

  });


  describe('element instance entries', function() {

    it('should render element instance activated label', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'SERVICE_TASK',
          state: 'ACTIVE'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Service Task activated')).to.exist;
    });


    it('should render element instance completed label', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'SERVICE_TASK',
          state: 'COMPLETED'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Service Task completed')).to.exist;
    });


    it('should render boundary event triggered label', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'BOUNDARY_EVENT',
          state: 'ACTIVE'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Boundary event triggered')).to.exist;
    });


    it('should render boundary event completed label', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'BOUNDARY_EVENT',
          state: 'COMPLETED'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Boundary event completed')).to.exist;
    });


    it('should render event sub-process triggered label', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'EVENT_SUB_PROCESS',
          state: 'ACTIVE'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Event sub-process triggered')).to.exist;
    });


    it('should render event sub-process completed label', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'EVENT_SUB_PROCESS',
          state: 'COMPLETED'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Event sub-process completed')).to.exist;
    });


    it('should render secondary label with element name', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'SERVICE_TASK',
          state: 'COMPLETED',
          elementId: 'ServiceTask_1',
          elementName: 'Foo'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Foo')).to.exist;
    });


    it('should fall back to element ID for secondary label', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'SERVICE_TASK',
          state: 'COMPLETED',
          elementId: 'ServiceTask_1'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('ServiceTask_1')).to.exist;
    });


    it('should show element instance duration', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'SERVICE_TASK',
          state: 'COMPLETED',
          elementId: 'ServiceTask_1',
          startDate: createMockDate(0),
          endDate: createMockDate(ONE_SECOND_MS * 3)
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('3.0s')).to.exist;
    });


    it('should expand element instance entry to show details', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'SERVICE_TASK',
          state: 'COMPLETED',
          elementId: 'ServiceTask_1',
          elementName: 'Foo',
          elementInstanceKey: '1'
        })
      ];

      const { container } = renderExecutionLog({ entries });

      // when
      fireEvent.click(container.querySelector('.execution-log__entry--expandable'));

      // then
      const details = container.querySelector('.execution-log__details');
      expect(details).to.exist;
      expect(details.textContent).to.include('Element');
      expect(details.textContent).to.include('ServiceTask_1');
      expect(details.textContent).to.include('Name');
      expect(details.textContent).to.include('Foo');
      expect(details.textContent).to.include('State');
      expect(details.textContent).to.include('Instance Key');
      expect(details.textContent).to.include('1');
    });

  });


  describe('message subscription entries', function() {

    it('should render message subscription created label', function() {

      // given
      const entries = [
        createMessageSubscriptionEntry({
          elementId: 'ReceiveTask_1',
          messageSubscriptionState: 'CREATED'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Message subscription created')).to.exist;
    });


    it('should render secondary label with message name', function() {

      // given
      const entries = [
        createMessageSubscriptionEntry({
          messageName: 'Foo',
          elementId: 'ReceiveTask_1'
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('Foo')).to.exist;
    });


    it('should expand message subscription entry to show details', function() {

      // given
      const entries = [
        createMessageSubscriptionEntry({
          messageName: 'Foo',
          elementId: 'ReceiveTask_1',
          messageSubscriptionState: 'CREATED',
          messageSubscriptionKey: '1'
        })
      ];

      const { container } = renderExecutionLog({ entries });

      // when
      fireEvent.click(container.querySelector('.execution-log__entry--expandable'));

      // then
      const details = container.querySelector('.execution-log__details');
      expect(details).to.exist;
      expect(details.textContent).to.include('Message');
      expect(details.textContent).to.include('Foo');
      expect(details.textContent).to.include('Element');
      expect(details.textContent).to.include('ReceiveTask_1');
      expect(details.textContent).to.include('State');
      expect(details.textContent).to.include('Subscription Key');
      expect(details.textContent).to.include('1');
    });

  });


  describe('active entries', function() {

    it('if should show active entry for pending job during execution', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'CREATED'
        })
      ];

      // when
      const { container } = renderExecutionLog({ entries, isTaskExecuting: true });

      // then
      const activeEntries = container.querySelectorAll('.execution-log__entry-wrapper--active');

      expect(activeEntries).to.have.length(1);
      expect(activeEntries[0].textContent).to.include('Waiting for job to be completed');
    });


    it('should show waiting entry for pending message subscription during execution', function() {

      // given
      const entries = [
        createMessageSubscriptionEntry({
          messageName: 'Foo',
          messageSubscriptionState: 'CREATED'
        })
      ];

      // when
      const { container } = renderExecutionLog({ entries, isTaskExecuting: true });

      // then
      const activeEntries = container.querySelectorAll('.execution-log__entry-wrapper--active');

      expect(activeEntries).to.have.length(1);
      expect(activeEntries[0].textContent).to.include('Waiting for message to be correlated');
    });


    it('should show active entry for pending user task during execution', function() {

      // given
      const entries = [
        createUserTaskEntry({
          state: 'CREATED',
          name: 'Foo'
        })
      ];

      // when
      const { container } = renderExecutionLog({ entries, isTaskExecuting: true });

      // then
      const activeEntries = container.querySelectorAll('.execution-log__entry-wrapper--active');

      expect(activeEntries).to.have.length(1);
      expect(activeEntries[0].textContent).to.include('Waiting for user task to be completed');
    });


    it('should NOT show waiting entry when not executing', function() {

      // given
      const entries = [
        createUserTaskEntry({ state: 'CREATED' })
      ];

      // when
      const { container } = renderExecutionLog({ entries, isTaskExecuting: false });

      // then
      const activeEntries = container.querySelectorAll('.execution-log__entry-wrapper--active');
      expect(activeEntries).to.have.length(0);
    });


    it('should show multiple active entries when multiple pending items during execution', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), { state: 'CREATED' }),
        createMessageSubscriptionEntry({ messageName: 'Foo', messageSubscriptionState: 'CREATED' }),
        createUserTaskEntry({ state: 'CREATED', name: 'Bar' })
      ];

      // when
      const { container } = renderExecutionLog({ entries, isTaskExecuting: true });

      // then
      const activeEntries = container.querySelectorAll('.execution-log__entry-wrapper--active');
      expect(activeEntries).to.have.length(3);
    });

  });


  describe('job CTA', function() {

    it('should render CTA for created job while executing', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'CREATED',
          type: 'io.camunda:http-json:1'
        })
      ];

      // when
      const { container } = renderExecutionLog({
        entries,
        isTaskExecuting: true,
        currentOperateUrl: 'https://operate.example.com'
      });

      // then
      expect(container.querySelector('.execution-log__cta-link')).to.exist;
      expect(container.querySelector('.execution-log__cta-link').textContent).to.include('Open in Operate');
      expect(container.querySelector('.execution-log__cta-link').getAttribute('href')).to.equal('https://operate.example.com');
    });


    it('should NOT render Operate link when currentOperateUrl is not set', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'CREATED',
          type: 'io.camunda:http-json:1'
        })
      ];

      // when
      const { container } = renderExecutionLog({
        entries,
        isTaskExecuting: true
      });

      // then
      expect(container.querySelector('.execution-log__cta')).to.exist;
      expect(container.querySelector('.execution-log__cta-link')).to.not.exist;
    });


    it('should NOT render CTA when not executing', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'CREATED',
          type: 'io.camunda:http-json:1'
        })
      ];

      // when
      const { container } = renderExecutionLog({
        entries,
        isTaskExecuting: false,
        currentOperateUrl: 'https://operate.example.com'
      });

      // then
      expect(container.querySelector('.execution-log__cta-link')).to.not.exist;
    });


    it('should NOT render CTA when job is completed', function() {

      // given
      const entries = [
        createJobEntry(createJobDetails(), createMockTimestamp(), {
          state: 'COMPLETED',
          type: 'io.camunda:http-json:1'
        })
      ];

      // when
      const { container } = renderExecutionLog({
        entries,
        isTaskExecuting: true,
        currentOperateUrl: 'https://operate.example.com'
      });

      // then
      expect(container.querySelector('.execution-log__cta-link')).to.not.exist;
    });

  });


  describe('message subscription CTA', function() {

    it('should render CTA for created message subscription while executing', function() {

      // given
      const entries = [
        createMessageSubscriptionEntry({
          messageSubscriptionState: 'CREATED'
        })
      ];

      // when
      const { container } = renderExecutionLog({
        entries,
        isTaskExecuting: true,
        currentOperateUrl: 'https://operate.example.com'
      });

      // then
      expect(container.querySelector('.execution-log__cta-link')).to.exist;
      expect(container.querySelector('.execution-log__cta-link').textContent).to.include('Open in Operate');
      expect(container.querySelector('.execution-log__cta-link').getAttribute('href')).to.equal('https://operate.example.com');
    });


    it('should NOT render Operate link when currentOperateUrl is not set', function() {

      // given
      const entries = [
        createMessageSubscriptionEntry({
          messageSubscriptionState: 'CREATED'
        })
      ];

      // when
      const { container } = renderExecutionLog({
        entries,
        isTaskExecuting: true
      });

      // then
      expect(container.querySelector('.execution-log__cta')).to.exist;
      expect(container.querySelector('.execution-log__cta-link')).to.not.exist;
    });


    it('should NOT render CTA when not executing', function() {

      // given
      const entries = [
        createMessageSubscriptionEntry({
          messageSubscriptionState: 'CREATED'
        })
      ];

      // when
      const { container } = renderExecutionLog({
        entries,
        isTaskExecuting: false,
        currentOperateUrl: 'https://operate.example.com'
      });

      // then
      expect(container.querySelector('.execution-log__cta')).to.not.exist;
    });


    it('should NOT render CTA when message is correlated', function() {

      // given
      const entries = [
        createMessageSubscriptionEntry({
          messageSubscriptionState: 'CORRELATED'
        })
      ];

      // when
      const { container } = renderExecutionLog({
        entries,
        isTaskExecuting: true,
        currentOperateUrl: 'https://operate.example.com'
      });

      // then
      expect(container.querySelector('.execution-log__cta')).to.not.exist;
    });

  });


  describe('user task CTA', function() {

    it('should render CTA for created user task while executing', function() {

      // given
      const entries = [
        createUserTaskEntry({
          state: 'CREATED',
          userTaskKey: '1'
        })
      ];

      // when
      const { container } = renderExecutionLog({
        entries,
        isTaskExecuting: true,
        tasklistBaseUrl: 'https://tasklist.example.com'
      });

      // then
      expect(container.querySelector('.execution-log__cta')).to.exist;
      expect(container.querySelector('.execution-log__cta-link')).to.exist;
      expect(container.querySelector('.execution-log__cta-link').textContent).to.include('Open in Tasklist');
      expect(container.querySelector('.execution-log__cta-link').getAttribute('href')).to.equal('https://tasklist.example.com/1');
    });


    it('should NOT render tasklist link when tasklistBaseUrl is not set', function() {

      // given
      const entries = [
        createUserTaskEntry({
          state: 'CREATED',
          userTaskKey: '1'
        })
      ];

      // when
      const { container } = renderExecutionLog({
        entries,
        isTaskExecuting: true
      });

      // then
      expect(container.querySelector('.execution-log__cta')).to.exist;
      expect(container.querySelector('.execution-log__cta-link')).to.not.exist;
    });


    it('should NOT render CTA when not executing', function() {

      // given
      const entries = [
        createUserTaskEntry({
          state: 'CREATED',
          userTaskKey: '1'
        })
      ];

      // when
      const { container } = renderExecutionLog({
        entries,
        isTaskExecuting: false
      });

      // then
      expect(container.querySelector('.execution-log__cta')).to.not.exist;
    });


    it('should NOT render CTA when user task is completed', function() {

      // given
      const entries = [
        createUserTaskEntry({
          state: 'COMPLETED'
        })
      ];

      // when
      const { container } = renderExecutionLog({
        entries,
        isTaskExecuting: true
      });

      // then
      expect(container.querySelector('.execution-log__cta')).to.not.exist;
    });

  });


  describe('multiple entries', function() {

    it('should render multiple entries in order', function() {

      // given
      const entries = [
        createStatusEntry('deployed', { processDefinitionId: 'Process_1' }),
        createStatusEntry('instance-started', { processInstanceKey: '2' }),
        createJobEntry({ state: 'CREATED', type: 'foo' }),
        createJobEntry({ state: 'COMPLETED', type: 'bar' }),
        createStatusEntry('completed', { processInstanceKey: '2' })
      ];

      // when
      const { container } = renderExecutionLog({ entries });

      // then
      expect(container.querySelectorAll('.execution-log__entry-wrapper')).to.have.length(5);
    });

  });


  describe('expanding', function() {

    it('should expand entry when clicking on toggle chevron', function() {

      // given
      const entries = [
        createJobEntry({
          state: 'COMPLETED',
          elementId: 'ServiceTask_1',
          jobKey: '1'
        })
      ];

      const { queryByText, container } = renderExecutionLog({ entries });

      // when
      fireEvent.click(container.querySelector('.execution-log__toggle'));

      // then
      expect(queryByText('Job Key')).to.exist;
      expect(queryByText('1')).to.exist;
    });

  });


  describe('duration formatting', function() {

    it('should render milliseconds for short durations', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'SERVICE_TASK',
          state: 'COMPLETED',
          startDate: createMockDate(),
          endDate: createMockDate(500)
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('500ms')).to.exist;
    });


    it('should render seconds for medium durations', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'SERVICE_TASK',
          state: 'COMPLETED',
          startDate: createMockDate(),
          endDate: createMockDate(ONE_SECOND_MS * 45)
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('45.0s')).to.exist;
    });


    it('should render minutes and seconds for long durations', function() {

      // given
      const entries = [
        createElementInstanceEntry({
          type: 'SERVICE_TASK',
          state: 'COMPLETED',
          startDate: createMockDate(),
          endDate: createMockDate(ONE_MINUTE_MS * 3 + ONE_SECOND_MS * 15)
        })
      ];

      // when
      const { queryByText } = renderExecutionLog({ entries });

      // then
      expect(queryByText('3m 15s')).to.exist;
    });

  });

});


function renderExecutionLog(props = {}) {
  const {
    entries = [],
    tasklistBaseUrl,
    currentOperateUrl,
    isTaskExecuting = false
  } = props;

  return render(
    <ExecutionLog
      entries={ entries }
      tasklistBaseUrl={ tasklistBaseUrl }
      currentOperateUrl={ currentOperateUrl }
      isTaskExecuting={ isTaskExecuting }
    />
  );
}

function createStatusEntry(status, data, timestamp = 0) {
  return {
    type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
    status,
    data,
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

function createElementInstanceEntry(data, timestamp = 0) {
  return {
    type: EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE,
    data: {
      type: 'SERVICE_TASK',
      state: 'ACTIVE',
      elementId: 'ServiceTask_1',
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
