import { render, screen, waitFor } from '@testing-library/react';

import { CloudElementTemplatesPropertiesProviderModule } from 'bpmn-js-element-templates';

import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  ZeebePropertiesProviderModule
} from 'bpmn-js-properties-panel';

import { bootstrapModeler, inject, getModeler } from '../../util/Util';

import TaskTesting from '../../../lib/components/TaskTesting/TaskTesting';

import { SINGLE_TASK_SELECTION_REQUIRED_MESSAGE } from '../../../lib/hooks/useSelectedElement';

import { DEFAULT_CONFIG } from '../../../lib/ElementConfig';

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


  it('should show _View in Operate_ button during task execution', inject(async function(elementRegistry, selection) {

    // given
    const api = {
      deploy: sinon.spy(() => Promise.resolve({ success: true, response: { processes: [ { processDefinitionId: '123' } ] } })),
      startInstance: sinon.spy(() => Promise.resolve({ success: true, response: { processInstanceKey: '123' } })),
      getInstance: sinon.spy(() => Promise.resolve({ success: true, response: {} })),
    };

    renderTaskTesting({
      isConnectionConfigured: true,
      operateBaseUrl : 'https://camunda.com',
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


  describe('_Test task_ button', function() {

    it('should start execution when connection configured',
      inject(async function(elementRegistry, selection) {

        // given
        const spy = sinon.spy(() => Promise.resolve({ success: true, error: 'foo' }));

        renderTaskTesting({
          isConnectionConfigured: true,
          api: {
            deploy: spy
          }
        });

        selection.select(elementRegistry.get('ServiceTask_1'));

        // when
        const button = await screen.findByTestId('test-task-btn');
        button.click();

        // then
        expect(spy).to.have.been.called;
      }));


    it('should call configure connection callback when connection not configured',
      inject(async function(elementRegistry, selection) {

        // given
        const spy = sinon.spy();

        renderTaskTesting({
          isConnectionConfigured: false,
          onConfigureConnection: spy
        });

        selection.select(elementRegistry.get('ServiceTask_1'));

        const button = await screen.findByTestId('test-task-btn');
        button.click();

        expect(spy).to.have.been.called;
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
    config = DEFAULT_CONFIG,
    onConfigChanged = () => {},
    operateBaseUrl,
    documentationUrl,
    onTaskExecutionStarted = () => {},
    onTaskExecutionFinished = () => {},
    onTaskExecutionInterrupted = () => {}
  } = props;

  return render(<TaskTesting
    injector={ injector }
    api={ api }
    isConnectionConfigured={ isConnectionConfigured }
    configureConnectionBannerTitle={ configureConnectionBannerTitle }
    configureConnectionBannerDescription={ configureConnectionBannerDescription }
    configureConnectionLabel={ configureConnectionLabel }
    onConfigureConnection={ onConfigureConnection }
    config={ config }
    onConfigChanged={ onConfigChanged }
    operateBaseUrl={ operateBaseUrl }
    documentationUrl={ documentationUrl }
    onTaskExecutionStarted={ onTaskExecutionStarted }
    onTaskExecutionFinished={ onTaskExecutionFinished }
    onTaskExecutionInterrupted={ onTaskExecutionInterrupted }
  />);
}