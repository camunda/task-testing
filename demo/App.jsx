import React, { useState, useRef, useEffect } from 'react';

import { debounce } from 'min-dash';

import BpmnModeler from 'camunda-bpmn-js/lib/camunda-cloud/Modeler';
import 'camunda-bpmn-js/dist/assets/camunda-cloud-modeler.css';

import TaskTesting from '../lib';

import diagram from './fixtures/diagram.bpmn';
import connectorTemplates from './fixtures/connectorTemplates.json';
import defaultConfig from './fixtures/config';

import '@carbon/styles/css/styles.min.css';
import './style.css';

function App() {
  const modelerRef = useRef(null);

  const [ modeler, setModeler ] = useState(null);

  const [ isConnectionConfigured, setIsConnectionConfigured ] = useState(false);

  const [ config, setConfig ] = useState(undefined);

  useEffect(() => {
    setTimeout(() => {
      setConfig(defaultConfig);
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

  const injector = modeler?.get('injector');

  const deploy = async () => {
    const { xml } = await modeler.saveXML();

    const response = await fetch('/api/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        xml
      })
    });

    return await response.json();
  };

  const startInstance = async (processId, elementId, variables) => {
    const response = await fetch('/api/startInstance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        processId,
        elementId,
        variables
      })
    });

    return response.json();
  };

  const getProcessInstance = (processInstanceKey) => {
    return fetch(`/api/getProcessInstance/${processInstanceKey}`)
      .then(response => response.json());
  };

  const getProcessInstanceVariables = async (processInstanceKey) => {
    return fetch(`/api/getProcessInstanceVariables/${processInstanceKey}`)
      .then(response => response.json());
  };

  const getProcessInstanceElementInstances = async (processInstanceKey) => {
    return fetch(`/api/getProcessInstanceElementInstances/${processInstanceKey}`)
      .then(response => response.json());
  };

  const getProcessInstanceIncident = async (processInstanceKey) => {
    return fetch(`/api/getProcessInstanceIncident/${processInstanceKey}`)
      .then(response => response.json());
  };

  const { current: onConfigChanged } = useRef(debounce(config => setConfig(config), 300));

  // eslint-disable-next-line no-undef
  const operateURL = `https://${ process.env.CAMUNDA_CLUSTER_REGION }.operate.camunda.io/${ process.env.CAMUNDA_CLUSTER_ID }/operate`;

  return (
    <>
      <div className="modeler" ref={ modelerRef }>
        <div id="canvas" className="canvas"></div>
        <div id="properties" className="properties-panel"></div>
      </div>
      <div className="task-testing">
        <TestTab
          injector={ injector }
          isConnectionConfigured={ isConnectionConfigured }
          configureConnectionBannerTitle="Not prompted yet"
          configureConnectionBannerDescription="Click Configure, then Ok when prompted."
          configureConnectionLabel="Get prompted"
          onConfigureConnection={ () => {
            if (window.confirm('Can execute task?')) {
              setIsConnectionConfigured(true);
            }
          } }
          api={ {
            deploy,
            startInstance,
            getProcessInstance,
            getProcessInstanceVariables,
            getProcessInstanceElementInstances,
            getProcessInstanceIncident
          } }
          config={ config }
          onConfigChanged={ onConfigChanged }
          operateBaseUrl={ operateURL }
          documentationUrl="https://docs.camunda.io/"
        />
      </div>
    </>
  );
}

function TestTab(props) {
  const { injector } = props;

  if (!injector) {
    return null;
  }

  return <TaskTesting { ...props } />;
}

export default App;