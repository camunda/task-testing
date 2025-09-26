import sinon from 'sinon';

import { render, screen, waitFor } from '@testing-library/react';

import { bootstrapModeler, getModeler, inject } from '../../util/Util';

import TaskTesting from '../../../lib/components/TaskTesting/TaskTesting';

import { SINGLE_TASK_SELECTION_REQUIRED_MESSAGE } from '../../../lib/hooks/useSelectedElement';

import diagramXML from '../../fixtures/diagram.bpmn';

describe('TaskTesting', function() {

  beforeEach(bootstrapModeler(diagramXML));


  it('should render', function() {

    // when
    renderTaskTesting();

    // then
    expect(screen.getByText(SINGLE_TASK_SELECTION_REQUIRED_MESSAGE)).to.exist;
  });


  describe('_Test task_ button', function() {

    it('should start execution when connection configured', inject(async function(injector) {

      // given
      const spy = sinon.spy(() => Promise.resolve({ success: true, error: 'foo' }));

      renderTaskTesting({
        isConnectionConfigured: true,
        api: {
          deploy: spy
        }
      });

      injector.get('selection').select(injector.get('elementRegistry').get('ServiceTask_1'));

      await waitFor(() => {
        expect(screen.getByTestId('test-task-btn').textContent).to.match(/Test task/);
      });

      // when
      screen.getByTestId('test-task-btn').click();

      // then
      await waitFor(() => {
        expect(spy).to.have.been.called;
      });
    }));


    it('should call configure connection callback when connection not configured', inject(async function(injector) {

      // given
      const spy = sinon.spy();

      renderTaskTesting({
        isConnectionConfigured: false,
        onConfigureConnection: spy
      });

      injector.get('selection').select(injector.get('elementRegistry').get('ServiceTask_1'));

      await waitFor(() => {
        expect(screen.getByTestId('test-task-btn').textContent).to.match(/Test task/);
      });

      // when
      screen.getByTestId('test-task-btn').click();

      // then
      await waitFor(() => {
        expect(spy).to.have.been.called;
      });
    }));

  });

});

function renderTaskTesting(props = {}) {
  const modeler = getModeler();

  const {
    injector = modeler.get('injector'),
    api,
    isConnectionConfigured,
    configureConnectionBannerTitle = 'Connection required',
    configureConnectionBannerDescription = 'Configure a connection to start testing.',
    configureConnectionLabel = 'Configure',
    onConfigureConnection,
    config = {
      input: {},
      output: {}
    },
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