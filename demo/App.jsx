import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

import { ToastNotification } from '@carbon/react';

import { debounce, merge } from 'min-dash';

import BpmnModeler from 'camunda-bpmn-js/lib/camunda-cloud/Modeler';
import 'camunda-bpmn-js/dist/assets/camunda-cloud-modeler.css';

import TaskTesting from '../lib';

import diagram1 from './fixtures/diagram_1.bpmn';
import diagram2 from './fixtures/diagram_2.bpmn';
import form1 from './fixtures/form_1.form';
import connectorTemplates from './fixtures/connectorTemplates.json';
import defaultConfig from './fixtures/config';

import '@carbon/styles/css/styles.min.css';
import './style.css';
import { RPALink, RPATab } from './plugins/RPA';
import {
  FooLinkDynamic,
  FooLinkStatic,
  FooTabDynamic,
  FooTabStatic
} from './plugins/Foo';

function App() {
  const modelerRef = useRef(null);

  const [ modeler, setModeler ] = useState(null);

  const [ isConnectionConfigured, setIsConnectionConfigured ] = useState(true);

  const [ config, setConfig ] = useState(undefined);

  useEffect(() => {
    setTimeout(() => {
      setConfig(merge(defaultConfig, {
        input: {
          'ServiceTask_2': JSON.stringify({
            foobar: 'foobar'.repeat(10000) // variables should not be truncated
          }, null, 2)
        }
      }));
    }, 1000);
  }, []);

  useEffect(() => {
    if (modelerRef.current) {
      setModeler(new BpmnModeler({
        container: '#canvas',
        propertiesPanel: {
          parent: '#properties'
        },
        elementTemplates: connectorTemplates
      }));
    }
  }, []);

  useEffect(() => {
    async function importXml() {
      await modeler.importXML(diagram1);

      modeler.get('canvas').zoom('fit-viewport');
    }

    if (modeler) {
      importXml();
    }
  }, [ modeler ]);

  useEffect(() => {
    console.log('Config updated:', config);
  }, [ config ]);

  const injector = modeler?.get('injector');

  const deploy = useCallback(async () => {
    const { xml } = await modeler.saveXML();

    const resources = [
      { name: 'diagram_1.bpmn', content: xml },
      { name: 'diagram_2.bpmn', content: diagram2 },
      { name: 'form.form', content: form1 }
    ];

    const response = await fetch('/api/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resources })
    });

    return await response.json();
  }, [ modeler ]);

  const startInstance = useCallback(async (processDefinitionKey, elementId, variables) => {
    const response = await fetch('/api/startInstance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        processDefinitionKey,
        elementId,
        variables
      })
    });

    return response.json();
  }, []);

  const getProcessInstance = useCallback((processInstanceKey) => {
    return fetch(`/api/getProcessInstance/${processInstanceKey}`)
      .then(response => response.json());
  }, []);

  const getProcessInstanceVariables = useCallback(async (processInstanceKey) => {
    return fetch(`/api/getProcessInstanceVariables/${processInstanceKey}`)
      .then(response => response.json());
  }, []);

  const getProcessInstanceElementInstances = useCallback(async (processInstanceKey) => {
    return fetch(`/api/getProcessInstanceElementInstances/${processInstanceKey}`)
      .then(response => response.json());
  }, []);

  const getProcessInstanceIncident = useCallback(async (processInstanceKey) => {
    return fetch(`/api/getProcessInstanceIncident/${processInstanceKey}`)
      .then(response => response.json());
  }, []);

  const getProcessInstanceJobs = useCallback(async (processInstanceKey) => {
    return fetch(`/api/getProcessInstanceJobs/${processInstanceKey}`)
      .then(response => response.json());
  }, []);

  const getProcessInstanceUserTasks = useCallback(async (processInstanceKey) => {
    return fetch(`/api/getProcessInstanceUserTasks/${processInstanceKey}`)
      .then(response => response.json());
  }, []);

  const getProcessInstanceMessageSubscriptions = useCallback(async (processInstanceKey) => {
    return fetch(`/api/getProcessInstanceMessageSubscriptions/${processInstanceKey}`)
      .then(response => response.json());
  }, []);

  const api = useMemo(() => ({
    deploy,
    getProcessInstance,
    getProcessInstanceElementInstances,
    getProcessInstanceIncident,
    getProcessInstanceJobs,
    getProcessInstanceMessageSubscriptions,
    getProcessInstanceUserTasks,
    getProcessInstanceVariables,
    startInstance
  }), [
    deploy,
    getProcessInstance,
    getProcessInstanceElementInstances,
    getProcessInstanceIncident,
    getProcessInstanceJobs,
    getProcessInstanceMessageSubscriptions,
    getProcessInstanceUserTasks,
    getProcessInstanceVariables,
    startInstance
  ]);

  const onConfigureConnection = useCallback(() => {
    if (window.confirm('Cluster selected?')) {
      setIsConnectionConfigured(true);
    }
  }, []);

  const onTestTask = useCallback(() => {
    if (isConnectionConfigured) {
      return true;
    }

    if (window.confirm('Cluster selected?')) {
      setIsConnectionConfigured(true);

      return true;
    }

    return false;
  }, [ isConnectionConfigured ]);

  const onTaskExecutionStarted = useCallback((element) => {
    console.log('Task execution started:', element.id);
  }, []);

  const onTaskExecutionFinished = useCallback((element, result) => {
    console.log('Task execution finished:', element.id, result.success ? 'success' : result.reason, result);
  }, []);

  const [ toast, setToast ] = useState(null);

  const onAppendOutputMapping = useCallback((element, sourceFeelExpression, targetName) => {
    appendOutputMapping(modeler, element, sourceFeelExpression, targetName);

    setToast({
      kind: 'success',
      title: 'Output mapping added',
      subtitle: `Mapped ${sourceFeelExpression} to ${targetName}.`
    });
  }, [ modeler ]);

  const onNavigateToOutputMapping = useCallback((element, targetName) => {
    console.log('Navigate to output mapping:', element.id, targetName);
  }, []);

  const { current: onConfigChanged } = useRef(debounce(config => setConfig(config), 300));

  // eslint-disable-next-line no-undef
  const operateBaseURL = process.env.CAMUNDA_OPERATE_BASE_URL;

  // eslint-disable-next-line no-undef
  const tasklistBaseURL = process.env.CAMUNDA_TASKLIST_BASE_URL;

  const connectionName = getConnectionName(operateBaseURL);

  return (
    <>
      <div className="modeler" ref={ modelerRef }>
        <div id="canvas" className="canvas"></div>
        <ResizablePanel className="properties-panel" defaultWidth={ 300 } minWidth={ 200 } maxWidth={ 600 }>
          <div id="properties" style={ { width: '100%', height: '100%' } }></div>
        </ResizablePanel>
        <ResizablePanel className="task-testing" defaultWidth={ 500 } minWidth={ 300 } maxWidth={ 800 }>
          <TestTab
            injector={ injector }
            isConnectionConfigured={ isConnectionConfigured }
            configureConnectionBannerTitle="No cluster selected"
            configureConnectionLabel="Select cluster"
            onConfigureConnection={ onConfigureConnection }
            onTestTask={ onTestTask }
            api={ api }
            config={ config }
            onConfigChanged={ onConfigChanged }
            operateBaseUrl={ operateBaseURL }
            tasklistBaseUrl={ tasklistBaseURL }
            connectionName={ connectionName }
            documentationUrl="https://docs.camunda.io/"
            onTaskExecutionStarted={ onTaskExecutionStarted }
            onTaskExecutionFinished={ onTaskExecutionFinished }
            onAppendOutputMapping={ onAppendOutputMapping }
            onNavigateToOutputMapping={ onNavigateToOutputMapping }
          />
        </ResizablePanel>
      </div>
      { toast && (
        <div className="demo-toast">
          <ToastNotification
            kind={ toast.kind }
            title={ toast.title }
            subtitle={ toast.subtitle }
            onClose={ () => setToast(null) }
            timeout={ 6000 }
          />
        </div>
      ) }
    </>
  );
}

/**
 * Append a `zeebe:Output` mapping to an element, creating the `zeebe:IoMapping`
 * extension element if missing.
 *
 * @param {Object} modeler
 * @param {Object} element
 * @param {string} source - FEEL expression
 * @param {string} target - variable name
 */
function appendOutputMapping(modeler, element, source, target) {
  const modeling = modeler.get('modeling');
  const bpmnFactory = modeler.get('bpmnFactory');

  const businessObject = element.businessObject;

  let extensionElements = businessObject.get('extensionElements');

  if (!extensionElements) {
    extensionElements = bpmnFactory.create('bpmn:ExtensionElements', { values: [] });
    extensionElements.$parent = businessObject;

    modeling.updateModdleProperties(element, businessObject, {
      extensionElements
    });
  }

  let ioMapping = extensionElements.get('values').find(value => value.$type === 'zeebe:IoMapping');

  if (!ioMapping) {
    ioMapping = bpmnFactory.create('zeebe:IoMapping', { inputParameters: [], outputParameters: [] });
    ioMapping.$parent = extensionElements;

    modeling.updateModdleProperties(element, extensionElements, {
      values: [ ...extensionElements.get('values'), ioMapping ]
    });
  }

  const output = bpmnFactory.create('zeebe:Output', { source, target });
  output.$parent = ioMapping;

  modeling.updateModdleProperties(element, ioMapping, {
    outputParameters: [ ...ioMapping.get('outputParameters'), output ]
  });
}

/**
 * Derive a friendly connection name from the Operate base URL host, falling
 * back to a static label.
 *
 * @param {string} [operateBaseUrl]
 * @returns {string}
 */
function getConnectionName(operateBaseUrl) {
  if (!operateBaseUrl) {
    return 'dev cluster';
  }

  try {
    return new URL(operateBaseUrl).host;
  } catch (e) {
    return 'dev cluster';
  }
}

function TestTab(props) {
  const { injector } = props;

  if (!injector) {
    return null;
  }

  return <TaskTesting { ...props }>
    <RPATab />
    <RPALink />
    <FooTabDynamic />
    <FooTabStatic />
    <FooLinkDynamic />
    <FooLinkStatic />
  </TaskTesting>;
}

function ResizablePanel({ children, className, defaultWidth, minWidth, maxWidth }) {
  const [ width, setWidth ] = useState(defaultWidth);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, [ width ]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [ minWidth, maxWidth ]);

  return (
    <div className={ className } style={ { width: `${width}px` } }>
      <div className="resize-handle" onMouseDown={ onMouseDown } />
      { children }
    </div>
  );
}

export default App;