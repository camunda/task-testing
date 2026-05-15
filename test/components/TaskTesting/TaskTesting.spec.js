/**
 * @import {
 *   TaskTestingAPI
 * } from '../../../lib/types';
 */

import { render, screen, waitFor } from '@testing-library/react';

import { CloudElementTemplatesPropertiesProviderModule } from 'bpmn-js-element-templates';

import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  ZeebePropertiesProviderModule
} from 'bpmn-js-properties-panel';

import { bootstrapModeler, inject, getModeler } from '../../helpers/modeler';
import {
  createDeployResponse,
  createElementInstanceDetails,
  createGetProcessInstanceElementInstancesResponse,
  createGetProcessInstanceIncidentResponse,
  createGetProcessInstanceJobsResponse,
  createGetProcessInstanceMessageSubscriptionsResponse,
  createGetProcessInstanceResponse,
  createGetProcessInstanceUserTasksResponse,
  createGetProcessInstanceVariablesResponse,
  createProcessInstanceDetails,
  createStartInstanceResponse
} from '../../helpers/responses';

import TaskTesting from '../../../lib/components/TaskTesting/TaskTesting';

import { DEFAULT_CONFIG } from '../../../lib/ElementConfig';
import { TASK_EXECUTION_FINISHED_REASON, POLL_INTERVAL_MS } from '../../../lib/TaskExecution';

import diagramXML from '../../fixtures/diagram.bpmn';
import templates from '../../fixtures/elementTemplates.json';

describe('TaskTesting', function() {

  beforeEach(bootstrapModeler(diagramXML, {
    additionalModules: [
      BpmnPropertiesPanelModule,
      BpmnPropertiesProviderModule,
      ZeebePropertiesProviderModule,
      CloudElementTemplatesPropertiesProviderModule
    ]
  }));

  beforeEach(inject(function(elementTemplates) {
    elementTemplates.set(templates);
  }));


  it('should render', inject(function() {

    // when
    renderTaskTesting();

    // then
    expect(screen.getByText('Select a task or subprocess to start testing.')).to.exist;
  }));


  it('should allow to test a task in an ad-hoc subprocess', inject(
    async function(elementRegistry, selection) {

      // given
      renderTaskTesting();

      // when
      selection.select(elementRegistry.get('AdHocSubProcessTask'));

      // then
      await screen.findByTestId('test-task-btn');
    })
  );


  it('should allow to test a task in a collapsed ad-hoc subprocess', inject(
    async function(elementRegistry, selection, canvas) {

      // given
      renderTaskTesting();

      // when
      canvas.setRootElement(canvas.findRoot('CollapsedSubProcess_plane'));
      selection.select(elementRegistry.get('CollapsedAdHocSubProcessTask'));

      // then
      await screen.findByTestId('test-task-btn');
    })
  );


  describe('Operate link', function() {

    it('should show during execution if operateBaseUrl provided', inject(async function(elementRegistry, selection) {

      // given
      const api = {
        deploy: sinon.spy(() => Promise.resolve(createDeployResponse())),
        startInstance: sinon.spy(() => Promise.resolve(createStartInstanceResponse())),
      };

      renderTaskTesting({
        operateBaseUrl: 'https://camunda.com',
        api
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_3'));

      const button = await screen.findByTestId('test-task-btn');

      button.click();

      // then
      await screen.findByText('Open in Operate');
    }));


    it('should show after task execution', inject(async function(elementRegistry, selection) {

      // given
      renderTaskTesting({
        operateBaseUrl: 'https://camunda.com',
        config: {
          input: {},
          output: {
            ServiceTask_3: {
              success: true,
              variables: {},
              operateUrl: 'https://camunda.com/operate/1'
            }
          }
        }
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_3'));

      const outputHeader = await screen.findByText('Result');

      outputHeader.click();

      // then
      await screen.findByText('Open in Operate');
    }));


    it('should not show if deployment failed', inject(async function(elementRegistry, selection) {

      // given
      const api = {
        deploy: sinon.spy(() => Promise.resolve(createDeployResponse({ success: false })))
      };

      renderTaskTesting({
        operateBaseUrl: 'https://camunda.com',
        api
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_3'));

      const button = await screen.findByTestId('test-task-btn');

      button.click();

      // then
      await waitFor(() => {
        expect(api.deploy).to.have.been.called;
      });

      const outputHeader = await screen.findByText('Result');

      outputHeader.click();

      expect(screen.queryByText('Open in Operate')).to.not.exist;
    }));

  });


  describe('header state', function() {

    describe('hasError', function() {

      it('should show error header state', inject(async function(elementRegistry, selection) {

        // given
        renderTaskTesting({
          hasError: true
        });

        // when
        selection.select(elementRegistry.get('ServiceTask_1'));

        // then
        await waitFor(async () => {
          expect(document.querySelector('.task-testing__container--header-error')).to.exist;
        });

        const statusText = document.querySelector('.task-testing__header-status-text');

        expect(statusText).to.exist;
        expect(statusText.textContent).to.equal('Error');

        const statusIcon = document.querySelector('.task-testing__status-icon--error');

        expect(statusIcon).to.exist;

        const button = await screen.findByTestId('test-task-btn');

        expect(button.classList.contains('cds--btn--secondary')).to.be.true;
      }));


      it('should not start execution when clicking "Run test"', inject(async function(elementRegistry, selection) {

        // given
        const deploySpy = sinon.spy(() => new Promise(() => {}));

        renderTaskTesting({
          hasError: true,
          api: {
            deploy: deploySpy
          }
        });

        // when
        selection.select(elementRegistry.get('ServiceTask_3'));

        const button = await screen.findByTestId('test-task-btn');

        await waitFor(() => {
          expect(document.querySelector('.task-testing__container--header-error')).to.exist;
        });

        button.click();

        // then
        await waitFor(() => {
          expect(deploySpy).not.to.have.been.called;
        });
      }));

    });


    describe('error', function() {

      it('should show error header state with custom banner title', inject(async function(elementRegistry, selection) {

        // given
        renderTaskTesting({
          hasError: true,
          errorBannerTitle: 'Connection error'
        });

        // when
        selection.select(elementRegistry.get('ServiceTask_1'));

        // then
        await waitFor(async () => {
          expect(document.querySelector('.task-testing__container--header-error')).to.exist;
        });

        const statusText = document.querySelector('.task-testing__header-status-text');

        expect(statusText).to.exist;
        expect(statusText.textContent).to.equal('Connection error');
      }));


      it('should show error header state', inject(async function(elementRegistry, selection) {

        // given
        renderTaskTesting({
          hasError: true,
          errorBannerTitle: 'Error'
        });

        // when
        selection.select(elementRegistry.get('ServiceTask_1'));

        // then
        await waitFor(async () => {
          expect(document.querySelector('.task-testing__container--header-error')).to.exist;
        });

        const statusText = document.querySelector('.task-testing__header-status-text');

        expect(statusText).to.exist;
        expect(statusText.textContent).to.equal('Error');
      }));

    });


    describe('input error', function() {

      it('should show error header state', inject(async function(elementRegistry, selection) {

        // given
        renderTaskTesting({
          config: {
            input: { ServiceTask_3: '{' },
            output: {}
          }
        });

        // when
        selection.select(elementRegistry.get('ServiceTask_3'));

        // then
        await waitFor(() => {
          expect(document.querySelector('.task-testing__container--header-error')).to.exist;
        });

        const statusText = document.querySelector('.task-testing__header-status-text');

        expect(statusText).to.exist;
        expect(statusText.textContent).to.equal('Input error');

        const statusIcon = document.querySelector('.task-testing__status-icon--error');

        expect(statusIcon).to.exist;

        const button = await screen.findByTestId('test-task-btn');

        expect(button.classList.contains('cds--btn--secondary')).to.be.true;
      }));


      it('should not start execution when clicking "Run test"', inject(async function(elementRegistry, selection) {

        // given
        const deploySpy = sinon.spy(() => new Promise(() => {}));

        renderTaskTesting({
          config: {
            input: { ServiceTask_3: '{' },
            output: {}
          },
          api: {
            deploy: deploySpy
          }
        });

        // when
        selection.select(elementRegistry.get('ServiceTask_3'));

        const button = await screen.findByTestId('test-task-btn');

        await waitFor(() => {
          expect(document.querySelector('.task-testing__container--header-error')).to.exist;
        });

        button.click();

        // then
        await waitFor(() => {
          expect(deploySpy).not.to.have.been.called;
        });
      }));

    });

  });


  describe('event callbacks', function() {

    let clock;

    afterEach(function() {
      clock?.restore();
      clock = null;
    });

    it('should call onTaskExecutionStarted when task execution starts', inject(async function(elementRegistry, selection) {

      // given
      const onTaskExecutionStarted = sinon.spy();

      const api = {
        deploy: sinon.spy(() => new Promise(() => {})),
      };

      renderTaskTesting({
        onTaskExecutionStarted,
        api
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_3'));

      const button = await screen.findByTestId('test-task-btn');

      button.click();

      // then
      await waitFor(() => {
        expect(onTaskExecutionStarted).to.have.been.calledOnce;
      });

      expect(onTaskExecutionStarted).to.have.been.calledOnce;
      expect(onTaskExecutionStarted).to.have.been.calledWithMatch(elementRegistry.get('ServiceTask_3'));
    }));


    it('should call onTaskExecutionFinished with error when deployment fails', inject(async function(elementRegistry, selection) {

      // given
      const onTaskExecutionFinished = sinon.spy();

      const api = {
        deploy: sinon.spy(() => Promise.resolve(createDeployResponse({ success: false, error: 'Deployment failed' }))),
      };

      renderTaskTesting({
        onTaskExecutionFinished,
        api
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_3'));

      const button = await screen.findByTestId('test-task-btn');

      button.click();

      // then
      await waitFor(() => {
        expect(api.deploy).to.have.been.called;
      });

      await waitFor(() => {
        expect(onTaskExecutionFinished).to.have.been.calledOnce;
      });

      expect(onTaskExecutionFinished).to.have.been.calledWithMatch(elementRegistry.get('ServiceTask_3'), {
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.ERROR,
        error: {
          message: 'Failed to deploy process definition',
          response: 'Deployment failed'
        }
      });
    }));


    it('should call onTaskExecutionFinished with error when start instance fails', inject(async function(elementRegistry, selection) {

      // given
      const onTaskExecutionFinished = sinon.spy();

      const api = {
        deploy: sinon.spy(() => Promise.resolve(createDeployResponse())),
        startInstance: sinon.spy(() => Promise.resolve(createStartInstanceResponse({ success: false, error: 'Start instance failed' }))),
      };

      renderTaskTesting({
        onTaskExecutionFinished,
        api
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_3'));

      const button = await screen.findByTestId('test-task-btn');

      button.click();

      // then
      await waitFor(() => {
        expect(api.startInstance).to.have.been.called;
      });

      await waitFor(() => {
        expect(onTaskExecutionFinished).to.have.been.calledOnce;
      });

      expect(onTaskExecutionFinished).to.have.been.calledWithMatch(elementRegistry.get('ServiceTask_3'), {
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.ERROR,
        error: {
          message: 'Failed to start process instance',
          response: 'Start instance failed'
        }
      });
    }));


    it('should call onTaskExecutionFinished when task execution finishes with success', inject(async function(elementRegistry, selection) {

      // given
      clock = getClock();

      const onTaskExecutionFinished = sinon.spy();

      const api = {
        deploy: sinon.spy(() => Promise.resolve(createDeployResponse())),
        getProcessInstance: sinon.spy(() => Promise.resolve(createGetProcessInstanceResponse({
          response: {
            items: [ createProcessInstanceDetails({ state: 'TERMINATED' }) ]
          }
        }))),
        getProcessInstanceElementInstances: sinon.spy(() => Promise.resolve(createGetProcessInstanceElementInstancesResponse({
          response: {
            items: [ createElementInstanceDetails({ elementId: 'ServiceTask_3', state: 'COMPLETED' }) ]
          }
        }))),
        getProcessInstanceIncident: sinon.spy(() => Promise.resolve(createGetProcessInstanceIncidentResponse())),
        getProcessInstanceJobs: sinon.spy(() => Promise.resolve(createGetProcessInstanceJobsResponse())),
        getProcessInstanceMessageSubscriptions: sinon.spy(() => Promise.resolve(createGetProcessInstanceMessageSubscriptionsResponse())),
        getProcessInstanceUserTasks: sinon.spy(() => Promise.resolve(createGetProcessInstanceUserTasksResponse())),
        getProcessInstanceVariables: sinon.spy(() => Promise.resolve(createGetProcessInstanceVariablesResponse())),
        startInstance: sinon.spy(() => Promise.resolve(createStartInstanceResponse()))
      };

      renderTaskTesting({
        operateBaseUrl: 'https://camunda.com',
        onTaskExecutionFinished,
        api
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_3'));

      const button = await screen.findByTestId('test-task-btn');

      button.click();

      // then
      await clock.tickAsync(POLL_INTERVAL_MS);

      expect(onTaskExecutionFinished).to.have.been.calledOnce;
      expect(onTaskExecutionFinished).to.have.been.calledWithMatch(elementRegistry.get('ServiceTask_3'), {
        success: true
      });
    }));


    it('should call onTaskExecutionFinished when task execution finishes with incident', inject(async function(elementRegistry, selection) {

      // given
      clock = getClock();

      const onTaskExecutionFinished = sinon.spy();

      const api = {
        deploy: sinon.spy(() => Promise.resolve(createDeployResponse())),
        getProcessInstance: sinon.spy(() => Promise.resolve(createGetProcessInstanceResponse({
          response: {
            items: [ createProcessInstanceDetails({ state: 'ACTIVE', hasIncident: true }) ]
          }
        }))),
        getProcessInstanceElementInstances: sinon.spy(() => Promise.resolve(createGetProcessInstanceElementInstancesResponse())),
        getProcessInstanceIncident: sinon.spy(() => Promise.resolve(createGetProcessInstanceIncidentResponse({
          response: {
            items: [ createGetProcessInstanceIncidentResponse({
              elementId: 'ServiceTask_3',
              errorMessage: 'No retries left',
              errorType: 'JOB_NO_RETRIES'
            }) ]
          }
        }))),
        getProcessInstanceJobs: sinon.spy(() => Promise.resolve(createGetProcessInstanceJobsResponse())),
        getProcessInstanceMessageSubscriptions: sinon.spy(() => Promise.resolve(createGetProcessInstanceMessageSubscriptionsResponse())),
        getProcessInstanceUserTasks: sinon.spy(() => Promise.resolve(createGetProcessInstanceUserTasksResponse())),
        getProcessInstanceVariables: sinon.spy(() => Promise.resolve(createGetProcessInstanceVariablesResponse())),
        startInstance: sinon.spy(() => Promise.resolve(createStartInstanceResponse()))
      };

      renderTaskTesting({
        operateBaseUrl: 'https://camunda.com',
        onTaskExecutionFinished,
        api
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_3'));

      const button = await screen.findByTestId('test-task-btn');

      button.click();

      // then
      await clock.tickAsync(POLL_INTERVAL_MS);

      expect(onTaskExecutionFinished).to.have.been.calledOnce;
      expect(onTaskExecutionFinished).to.have.been.calledWithMatch(elementRegistry.get('ServiceTask_3'), {
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.INCIDENT,
        incident: {
          errorMessage: 'No retries left',
          errorType: 'JOB_NO_RETRIES'
        }
      });
    }));


    it('should call onTaskExecutionFinished with reason "user.selectionChanged" when selection changes during task execution', inject(async function(elementRegistry, selection) {

      // given
      const onTaskExecutionFinished = sinon.spy();

      const api = {
        deploy: sinon.spy(() => new Promise(() => {})),
      };

      renderTaskTesting({
        onTaskExecutionFinished,
        api
      });

      selection.select(elementRegistry.get('ServiceTask_3'));

      const button = await screen.findByTestId('test-task-btn');

      button.click();

      await waitFor(() => {
        expect(api.deploy).to.have.been.called;
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_1'));

      // then
      await waitFor(() => {
        expect(onTaskExecutionFinished).to.have.been.calledOnce;
      });

      expect(onTaskExecutionFinished).to.have.been.calledWithMatch(elementRegistry.get('ServiceTask_3'), {
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.USER_SELECTION_CHANGED
      });
    }));


    it('should call onTaskExecutionFinished with reason "user.cancel" when task execution is manually canceled by the user', inject(async function(elementRegistry, selection) {

      // given
      const onTaskExecutionFinished = sinon.spy();

      const api = {
        deploy: sinon.spy(() => new Promise(() => {})),
      };

      renderTaskTesting({
        onTaskExecutionFinished,
        api
      });

      selection.select(elementRegistry.get('ServiceTask_3'));

      const button = await screen.findByTestId('test-task-btn');

      button.click();

      await waitFor(() => {
        expect(api.deploy).to.have.been.called;
      });

      await waitFor(() => {
        expect(button.textContent).to.equal('Stop test');
      });

      // when
      button.click();

      // then
      await waitFor(() => {
        expect(onTaskExecutionFinished).to.have.been.calledOnce;
      });

      expect(onTaskExecutionFinished).to.have.been.calledWithMatch(elementRegistry.get('ServiceTask_3'), {
        success: false,
        reason: TASK_EXECUTION_FINISHED_REASON.USER_CANCEL
      });
    }));

  });


  describe('Test button', function() {

    it('should start execution when connection configured and onTestTask not provided',
      inject(async function(elementRegistry, selection) {

        // given
        const spy = sinon.spy(() => new Promise(() => {}));

        renderTaskTesting({
          onTestTask: null,
          api: {
            deploy: spy
          }
        });

        selection.select(elementRegistry.get('ServiceTask_1'));

        // when
        const button = await screen.findByTestId('test-task-btn');

        button.click();

        // then
        await waitFor(() => {
          expect(spy).to.have.been.called;
        });
      }));


    it('should start execution when connection configured and onTestTask provided (return true)',
      inject(async function(elementRegistry, selection) {

        // given
        const spy = sinon.spy(() => new Promise(() => {}));

        renderTaskTesting({
          onTestTask: async () => true,
          api: {
            deploy: spy
          }
        });

        selection.select(elementRegistry.get('ServiceTask_1'));

        // when
        const button = await screen.findByTestId('test-task-btn');

        button.click();

        // then
        await waitFor(() => {
          expect(spy).to.have.been.called;
        });
      }));


    it('should disable _Test task_ button while awaiting onTestTask',
      inject(async function(elementRegistry, selection) {

        // given
        const spy = sinon.spy(() => new Promise(() => {}));

        let resolveOnTestTask;

        const onTestTaskPromise = new Promise((resolve) => {
          resolveOnTestTask = resolve;
        });

        const onTestTask = async () => {
          await onTestTaskPromise;
          return true;
        };

        renderTaskTesting({
          onTestTask,
          api: {
            deploy: spy
          }
        });

        selection.select(elementRegistry.get('ServiceTask_1'));

        // when
        const button = await screen.findByTestId('test-task-btn');

        await waitFor(() => {
          expect(button.getAttribute('disabled')).not.to.exist;
        });

        button.click();

        // then
        await waitFor(() => {
          expect(button.getAttribute('disabled')).to.exist;
        });

        // when
        resolveOnTestTask(true);

        // then
        await waitFor(() => {
          expect(spy).to.have.been.called;
        });

        await waitFor(() => {
          expect(button.getAttribute('disabled')).not.to.exist;
        });
      }));


    it('should not start execution when connection configured and onTestTask provided (return false)',
      inject(async function(elementRegistry, selection) {

        // given
        const spy = sinon.spy(() => new Promise(() => {}));

        renderTaskTesting({
          onTestTask: async () => false,
          api: {
            deploy: spy
          }
        });

        selection.select(elementRegistry.get('ServiceTask_1'));

        // when
        const button = await screen.findByTestId('test-task-btn');

        button.click();

        // then
        await waitFor(() => {
          expect(spy).not.to.have.been.called;
        });
      }));


    it('should cancel execution when task is executing',
      inject(async function(elementRegistry, selection) {

        // given
        const spy = sinon.spy(() => new Promise(() => {}));

        renderTaskTesting({
          onTestTask: null,
          api: {
            deploy: spy
          }
        });

        selection.select(elementRegistry.get('ServiceTask_1'));

        // when
        let button = await screen.findByTestId('test-task-btn');

        expect(button.textContent).to.equal('Run test');

        button.click();

        // then
        await waitFor(() => {
          expect(spy).to.have.been.called;
        });

        // when
        button = await screen.findByTestId('test-task-btn');

        await waitFor(() => {
          expect(button.textContent).to.equal('Stop test');
        });

        button.click();

        // then
        await waitFor(() => {
          expect(button.textContent).to.equal('Run test');
        });
      }));

  });


  describe('configure button', function() {

    it('should render if onConfigure provided', inject(async function(elementRegistry, selection) {

      // given
      const spy = sinon.spy();

      renderTaskTesting({
        onConfigure: spy
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_1'));

      // then
      await waitFor(() => {
        expect(screen.findByTestId('configure-btn')).to.exist;
      });

      // when
      const button = await screen.findByTestId('configure-btn');

      button.click();

      // then
      await waitFor(() => {
        expect(spy).to.have.been.called;
      });
    }));


    it('should not render if onConfigure not provided', inject(async function(elementRegistry, selection) {

      // given
      renderTaskTesting({});

      selection.select(elementRegistry.get('ServiceTask_1'));

      // then
      await waitFor(() => {
        expect(screen.queryByTestId('configure-btn')).not.to.exist;
      });
    }));

  });

});

/** @type {TaskTestingAPI} */
const DEFAULT_API = {
  deploy: () => {},
  getProcessInstance: () => {},
  getProcessInstanceElementInstances: () => {},
  getProcessInstanceIncident: () => {},
  getProcessInstanceJobs: () => {},
  getProcessInstanceMessageSubscriptions: () => {},
  getProcessInstanceUserTasks: () => {},
  getProcessInstanceVariables: () => {},
  startInstance: () => {}
};

function renderTaskTesting(props = {}) {
  const modeler = getModeler();

  const {
    injector = modeler.get('injector'),
    api = DEFAULT_API,
    hasError,
    errorBannerTitle,
    configureTooltip,
    onConfigure,
    onTestTask,
    config = DEFAULT_CONFIG,
    onConfigChanged = () => {},
    operateBaseUrl,
    documentationUrl,
    onTaskExecutionStarted = () => {},
    onTaskExecutionFinished = () => {}
  } = props;

  return render(<TaskTesting
    injector={ injector }
    api={ api }
    hasError={ hasError }
    errorBannerTitle={ errorBannerTitle }
    configureTooltip={ configureTooltip }
    onConfigure={ onConfigure }
    onTestTask={ onTestTask }
    config={ config }
    onConfigChanged={ onConfigChanged }
    operateBaseUrl={ operateBaseUrl }
    documentationUrl={ documentationUrl }
    onTaskExecutionStarted={ onTaskExecutionStarted }
    onTaskExecutionFinished={ onTaskExecutionFinished }
  />);
}

function getClock() {

  // Only fake setTimeout/setInterval, leave requestAnimationFrame for React
  return sinon.useFakeTimers({ shouldAdvanceTime: true, toFake: [ 'setTimeout', 'setInterval' ] });
}
