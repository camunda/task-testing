import { render, screen, waitFor } from '@testing-library/react';

import { CloudElementTemplatesPropertiesProviderModule } from 'bpmn-js-element-templates';

import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  ZeebePropertiesProviderModule
} from 'bpmn-js-properties-panel';

import { bootstrapModeler, inject, getModeler } from '../../util/Util';

import TaskTesting from '../../../lib/components/TaskTesting/TaskTesting';

import {
  SINGLE_TASK_SELECTION_REQUIRED_MESSAGE,
  AD_HOC_SUBPROCESS_TASK_UNSUPPORTED_MESSAGE
} from '../../../lib/hooks/useSelectedElement';

import { DEFAULT_CONFIG } from '../../../lib/ElementConfig';
import { TASK_EXECUTION_REASON } from '../../../lib/constants';

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
    expect(screen.getByText(SINGLE_TASK_SELECTION_REQUIRED_MESSAGE)).to.exist;
  }));


  it('should show task type and name (generic)', inject(async function(elementRegistry, selection) {

    // given
    renderTaskTesting();

    // when
    selection.select(elementRegistry.get('ServiceTask_1'));

    // then
    await screen.findByText('Script Task');
    await screen.findByText('No inputs');
  }));


  it('should show task type and name (element template)', inject(async function(elementRegistry, selection) {

    // given
    renderTaskTesting();

    // when
    selection.select(elementRegistry.get('ServiceTask_3'));

    // then
    await screen.findByText('REST Outbound Connector');
    await screen.findByText('REST');
  }));


  it('should display unsupported message for a task in ad-hoc subprocess', inject(
    async function(elementRegistry, selection) {

      // given
      renderTaskTesting();

      // when
      selection.select(elementRegistry.get('AdHocSubProcessTask'));

      // then
      await screen.findByText(AD_HOC_SUBPROCESS_TASK_UNSUPPORTED_MESSAGE);
    })
  );


  it('should display unsupported message for a task in a collapsed ad-hoc subprocess', inject(
    async function(elementRegistry, selection, canvas) {

      // given
      renderTaskTesting();

      // when
      canvas.setRootElement(canvas.findRoot('CollapsedSubProcess_plane'));
      selection.select(elementRegistry.get('CollapsedAdHocSubProcessTask'));

      // then
      await screen.findByText(AD_HOC_SUBPROCESS_TASK_UNSUPPORTED_MESSAGE);
    })
  );


  describe('_View in Operate_ button', function() {

    it('should show during task execution', inject(async function(elementRegistry, selection) {

      // given
      const api = {
        deploy: sinon.spy(() => Promise.resolve({
          success: true,
          response: {
            deployments: [
              {
                processDefinition: {
                  processDefinitionId: 'Process_TaskTesting',
                  processDefinitionKey: '123'
                }
              }
            ]
          }
        })),
        startInstance: sinon.spy(() => Promise.resolve({ success: true, response: { processInstanceKey: '123' } })),
        getInstance: sinon.spy(() => Promise.resolve({ success: true, response: {} })),
      };

      renderTaskTesting({
        isConnectionConfigured: true,
        operateBaseUrl: 'https://camunda.com',
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

      await screen.findByText('View in Operate');

      expect(api.getInstance).to.have.not.been.called;
    }));


    it('should not show if deployment failed', inject(async function(elementRegistry, selection) {

      // given
      const api = {
        deploy: sinon.spy(() => Promise.resolve({ success: false, error: 'foo' })),
      };

      renderTaskTesting({
        isConnectionConfigured: true,
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

      expect(screen.queryByText('View in Operate')).to.not.exist;
    }));
  });


  describe('callback events', function() {

    it('should call onTaskExecutionFinished with error when deployment fails', inject(async function(elementRegistry, selection) {

      // given
      const onTaskExecutionFinished = sinon.spy();
      const api = {
        deploy: sinon.spy(() => Promise.resolve({ success: false, error: 'Deployment failed' })),
      };

      renderTaskTesting({
        isConnectionConfigured: true,
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

      // Should fire finished event with 'error' reason
      await waitFor(() => {
        expect(onTaskExecutionFinished).to.have.been.calledOnce;
      });
      expect(onTaskExecutionFinished).to.have.been.calledWithMatch(elementRegistry.get('ServiceTask_3'), {
        success: false,
        reason: TASK_EXECUTION_REASON.ERROR,
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
        deploy: sinon.spy(() => Promise.resolve({
          success: true,
          response: {
            deployments: [
              {
                processDefinition: {
                  processDefinitionId: 'Process_TaskTesting',
                  processDefinitionKey: '123'
                }
              }
            ]
          }
        })),
        startInstance: sinon.spy(() => Promise.resolve({ success: false, error: 'Start instance failed' })),
      };

      renderTaskTesting({
        isConnectionConfigured: true,
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

      // Should fire finished event with 'error' reason
      await waitFor(() => {
        expect(onTaskExecutionFinished).to.have.been.calledOnce;
      });
      expect(onTaskExecutionFinished).to.have.been.calledWithMatch(elementRegistry.get('ServiceTask_3'), {
        success: false,
        reason: TASK_EXECUTION_REASON.ERROR,
        error: {
          message: 'Failed to start process instance',
          response: 'Start instance failed'
        }
      });
    }));


    it('should call onTaskExecutionStarted when task execution starts', inject(async function(elementRegistry, selection) {

      // given
      const onTaskExecutionStarted = sinon.spy();
      const api = {
        deploy: sinon.spy(() => new Promise(() => {})),
      };

      renderTaskTesting({
        isConnectionConfigured: true,
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


    it('should call onTaskExecutionFinished when task execution finishes with success', inject(async function(elementRegistry, selection) {

      // given
      const onTaskExecutionFinished = sinon.spy();
      const api = {
        deploy: sinon.spy(() => Promise.resolve({
          success: true,
          response: {
            deployments: [
              {
                processDefinition: {
                  processDefinitionId: 'Process_TaskTesting',
                  processDefinitionKey: '123'
                }
              }
            ]
          }
        })),
        startInstance: sinon.spy(() => Promise.resolve({
          success: true,
          response: { processInstanceKey: '456' }
        })),
        getProcessInstance: sinon.spy(() => Promise.resolve({
          success: true,
          response: {
            items: [
              {
                processDefinitionId: 'Process_TaskTesting',
                processInstanceKey: '456',
                state: 'COMPLETED'
              }
            ]
          }
        })),
        getProcessInstanceVariables: sinon.spy(() => Promise.resolve({
          success: true,
          response: { items: [] }
        })),
        getProcessInstanceElementInstances: sinon.spy(() => Promise.resolve({
          success: true,
          response: { items: [] }
        }))
      };

      renderTaskTesting({
        isConnectionConfigured: true,
        operateBaseUrl: 'https://camunda.com',
        onTaskExecutionFinished,
        api
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_3'));

      const button = await screen.findByTestId('test-task-btn');
      button.click();

      // then
      await waitFor(() => {
        expect(onTaskExecutionFinished).to.have.been.calledOnce;
      }, { timeout: 5000 });

      expect(onTaskExecutionFinished).to.have.been.calledOnce;
      expect(onTaskExecutionFinished).to.have.been.calledWithMatch(elementRegistry.get('ServiceTask_3'), {
        success: true
      });
    }));


    it('should call onTaskExecutionFinished when task execution finishes with incident', inject(async function(elementRegistry, selection) {

      // given
      const onTaskExecutionFinished = sinon.spy();
      const api = {
        deploy: sinon.spy(() => Promise.resolve({
          success: true,
          response: {
            deployments: [
              {
                processDefinition: {
                  processDefinitionId: 'Process_TaskTesting',
                  processDefinitionKey: '123'
                }
              }
            ]
          }
        })),
        startInstance: sinon.spy(() => Promise.resolve({
          success: true,
          response: { processInstanceKey: '456' }
        })),
        getProcessInstance: sinon.spy(() => Promise.resolve({
          success: true,
          response: {
            items: [
              {
                processDefinitionId: 'Process_TaskTesting',
                processInstanceKey: '456',
                state: 'COMPLETED',
                hasIncident: true
              }
            ]
          }
        })),
        getProcessInstanceVariables: sinon.spy(() => Promise.resolve({
          success: true,
          response: { items: [] }
        })),
        getProcessInstanceElementInstances: sinon.spy(() => Promise.resolve({
          success: true,
          response: { items: [] }
        })),
        getProcessInstanceIncident: sinon.spy(() => Promise.resolve({
          success: true,
          response: {
            items: [
              {
                errorMessage: 'Something went wrong',
                errorType: 'JOB_NO_RETRIES'
              }
            ]
          }
        }))
      };

      renderTaskTesting({
        isConnectionConfigured: true,
        operateBaseUrl: 'https://camunda.com',
        onTaskExecutionFinished,
        api
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_3'));

      const button = await screen.findByTestId('test-task-btn');
      button.click();

      // then
      await waitFor(() => {
        expect(onTaskExecutionFinished).to.have.been.calledOnce;
      }, { timeout: 5000 });

      expect(onTaskExecutionFinished).to.have.been.calledWithMatch(elementRegistry.get('ServiceTask_3'), {
        success: false,
        reason: TASK_EXECUTION_REASON.INCIDENT,
        incident: {
          errorMessage: 'Something went wrong',
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
        isConnectionConfigured: true,
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
        reason: TASK_EXECUTION_REASON.USER_SELECTION_CHANGED
      });
    }));


    it('should call onTaskExecutionFinished with reason "user.cancel" when task execution is manually canceled by the user', inject(async function(elementRegistry, selection) {

      // given
      const onTaskExecutionFinished = sinon.spy();
      const api = {
        deploy: sinon.spy(() => new Promise(() => {})),
      };

      renderTaskTesting({
        isConnectionConfigured: true,
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
        expect(button.textContent).to.equal('Cancel');
      });

      // when
      button.click();

      // then
      await waitFor(() => {
        expect(onTaskExecutionFinished).to.have.been.calledOnce;
      });
      expect(onTaskExecutionFinished).to.have.been.calledWithMatch(elementRegistry.get('ServiceTask_3'), {
        success: false,
        reason: TASK_EXECUTION_REASON.USER_CANCEL
      });
    }));

  });


  describe('_Test task_ button', function() {

    it('should start execution when connection configured and onTestTask not provided',
      inject(async function(elementRegistry, selection) {

        // given
        const spy = sinon.spy(() => new Promise(() => {}));

        renderTaskTesting({
          isConnectionConfigured: true,
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
          isConnectionConfigured: true,
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
          isConnectionConfigured: true,
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
          isConnectionConfigured: true,
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
          isConnectionConfigured: true,
          onTestTask: null,
          api: {
            deploy: spy
          }
        });

        selection.select(elementRegistry.get('ServiceTask_1'));

        // when
        let button = await screen.findByTestId('test-task-btn');

        expect(button.textContent).to.equal('Test task');

        button.click();

        // then
        await waitFor(() => {
          expect(spy).to.have.been.called;
        });

        // when
        button = await screen.findByTestId('test-task-btn');

        await waitFor(() => {
          expect(button.textContent).to.equal('Cancel');
        });

        button.click();

        // then
        await waitFor(() => {
          expect(button.textContent).to.equal('Test task');
        });
      }));

  });


  describe('_Configure connection_ button', function() {

    it('should render if onConfigureConnection provided', inject(async function(elementRegistry, selection) {

      // given
      const spy = sinon.spy();

      renderTaskTesting({
        isConnectionConfigured: false,
        onConfigureConnection: spy
      });

      // when
      selection.select(elementRegistry.get('ServiceTask_1'));

      // then
      await waitFor(() => {
        expect(screen.findByTestId('configure-connection-btn')).to.exist;
      });

      // when
      const button = await screen.findByTestId('configure-connection-btn');

      button.click();

      // then
      await waitFor(() => {
        expect(spy).to.have.been.called;
      });
    }));


    it('should not render if onConfigureConnection not provided', inject(async function(elementRegistry, selection) {

      // given
      renderTaskTesting({
        isConnectionConfigured: false,
        onConfigureConnection: null
      });

      selection.select(elementRegistry.get('ServiceTask_1'));

      // then
      await waitFor(() => {
        expect(screen.queryByTestId('configure-connection-btn')).not.to.exist;
      });
    }));

  });

});

const DEFAULT_API = {
  deploy: () => {},
  startInstance: () => {},
  getInstance: () => {},
  getProcessInstanceVariables: () => {},
  getProcessInstanceElementInstances: () => {},
  getProcessInstanceIncident: () => {}
};

function renderTaskTesting(props = {}) {
  const modeler = getModeler();

  const {
    injector = modeler.get('injector'),
    api = DEFAULT_API,
    isConnectionConfigured,
    configureConnectionBannerTitle = 'Connection required',
    configureConnectionBannerDescription = 'Configure a connection to start testing.',
    configureConnectionLabel = 'Configure',
    onConfigureConnection,
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
    isConnectionConfigured={ isConnectionConfigured }
    configureConnectionBannerTitle={ configureConnectionBannerTitle }
    configureConnectionBannerDescription={ configureConnectionBannerDescription }
    configureConnectionLabel={ configureConnectionLabel }
    onConfigureConnection={ onConfigureConnection }
    onTestTask={ onTestTask }
    config={ config }
    onConfigChanged={ onConfigChanged }
    operateBaseUrl={ operateBaseUrl }
    documentationUrl={ documentationUrl }
    onTaskExecutionStarted={ onTaskExecutionStarted }
    onTaskExecutionFinished={ onTaskExecutionFinished }
  />);
}