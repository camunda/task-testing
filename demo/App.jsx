import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

import { debounce, merge } from 'min-dash';

import BpmnModeler from 'camunda-bpmn-js/lib/camunda-cloud/Modeler';
import 'camunda-bpmn-js/dist/assets/camunda-cloud-modeler.css';

import TaskTesting from '../lib';

import diagram from './fixtures/diagram.bpmn';
import form from './fixtures/form.form';
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
      await modeler.importXML(diagram);

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

    const resources = [ { name: 'diagram.bpmn', content: xml } ];

    if (form) {
      resources.push({ name: 'form.form', content: form });
    }

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

  const getProcessInstanceJobs = useCallback(async (processInstanceKey, elementId) => {
    return fetch(`/api/getProcessInstanceJobs/${processInstanceKey}?elementId=${elementId}`)
      .then(response => response.json());
  }, []);

  const getProcessInstanceUserTasks = useCallback(async (processInstanceKey, elementId) => {
    return fetch(`/api/getProcessInstanceUserTasks/${processInstanceKey}?elementId=${elementId}`)
      .then(response => response.json());
  }, []);

  const getProcessInstanceMessageSubscriptions = useCallback(async (processInstanceKey, elementId) => {
    return fetch(`/api/getProcessInstanceMessageSubscriptions/${processInstanceKey}?elementId=${elementId}`)
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

  const { current: onConfigChanged } = useRef(debounce(config => setConfig(config), 300));

  // eslint-disable-next-line no-undef
  const operateBaseURL = process.env.CAMUNDA_OPERATE_BASE_URL;

  // eslint-disable-next-line no-undef
  const tasklistBaseURL = process.env.CAMUNDA_TASKLIST_BASE_URL;

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
            configureConnectionBannerDescription="Select a Camunda 8.8 cluster to enable task testing."
            configureConnectionLabel="Select cluster"
            onConfigureConnection={ onConfigureConnection }
            onTestTask={ onTestTask }
            api={ api }
            config={ config }
            onConfigChanged={ onConfigChanged }
            operateBaseUrl={ operateBaseURL }
            tasklistBaseUrl={ tasklistBaseURL }
            documentationUrl="https://docs.camunda.io/"
            onTaskExecutionStarted={ onTaskExecutionStarted }
            onTaskExecutionFinished={ onTaskExecutionFinished }
          />
        </ResizablePanel>
      </div>
    </>
  );
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