import React, { useState, useRef, useEffect } from 'react';

import BpmnModeler from 'camunda-bpmn-js/lib/camunda-cloud/Modeler';
import 'camunda-bpmn-js/dist/assets/camunda-cloud-modeler.css';

import TaskTesting from '../lib';

import diagram from './diagram.bpmn';

import connectorTemplates from './connectorTemplates.json';

import '@carbon/styles/css/styles.min.css';
import './style.css';

function App() {
  const modelerRef = useRef(null);

  const [ modeler, setModeler ] = useState(null);

  const [ isConnectionConfigured, setIsConnectionConfigured ] = useState(false);

  const [ config, setConfig ] = useState(undefined);

  useEffect(() => {
    setTimeout(() => {
      setConfig({
        input: {
          'ServiceTask_1': JSON.stringify({
            a: 1,
            b: 2,
            c: {
              d: 3,
              e: 4,
              f: [ 5, 6, 7 ]
            },
            g: 8,
            h: 9,
            i: 10,
            j: {
              k: 11,
              l: 12
            },
            m: 13,
            n: 14,
            o: 15,
            p: 16,
            q: 17,
            r: 18,
            s: 19,
            t: 20
          }, null, 2)
        },
        output: {
          'ServiceTask_1': {
            success: true,
            variables: {
              'm': 13,
              'g': 8,
              'a': 1,
              'c': {
                'd': 3,
                'e': 4,
                'f': [
                  5,
                  6,
                  7
                ]
              },
              'p': 16,
              'j': {
                'k': 11,
                'l': 12
              },
              'i': 10,
              'h': 9,
              's': 19,
              'o': 15,
              't': 20,
              'n': 14,
              'q': 17,
              'r': 18,
              'b': 2,
              'fooPlusOne': null,
              'output1': 1,
              'output4': 'foo',
              'output2': true,
              'output3': {
                'foo': 1
              }
            }
          },
          'ServiceTask_2': {
            success: true,
            variables: {
              'a': 'foo',
              'c': 'bar',
              'e': 'baz'
            }
          },
          'ServiceTask_4': {
            'success': false,
            'incident': {
              'key': '2251799813897058',
              'processDefinitionKey': '2251799813894253',
              'processInstanceKey': '2251799813897034',
              'type': 'JOB_NO_RETRIES',
              'message': 'Bad gateway',
              'creationTime': '2025-09-15T12:24:25.639+0000',
              'state': 'ACTIVE',
              'jobKey': '2251799813897044',
              'tenantId': '<default>'
            },
            'variables': {
              'readTimeoutInSeconds': 20,
              'method': 'GET',
              'ignoreNullValues': false,
              'authentication': {
                'type': 'noAuth'
              },
              'url': 'https://camunda.foobar',
              'storeResponse': false,
              'connectionTimeoutInSeconds': 20,
              'error': {
                'code': '502',
                'variables': {
                  'response': {
                    'headers': {
                      'Content-Length': '88',
                      'X-Smokescreen-Error': 'Failed to resolve remote hostname: lookup camunda.foobar on 10.44.0.10:53: no such host',
                      'Content-Type': 'text/plain'
                    },
                    'body': 'Failed to resolve remote hostname: lookup camunda.foobar on 10.44.0.10:53: no such host\n'
                  }
                },
                'message': 'Bad gateway',
                'type': 'io.camunda.connector.api.error.ConnectorException'
              }
            }
          }
        }
      });
    }, 3000);
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

  const getProcessInstanceIncident = async (processInstanceKey) => {
    return fetch(`/api/getProcessInstanceIncident/${processInstanceKey}`)
      .then(response => response.json());
  };

  const onConfigChanged = (config) => {
    setConfig(config);
  };

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
            getProcessInstanceIncident
          } }
          config={ config }
          onConfigChanged={ onConfigChanged }
          operateBaseUrl={ operateURL }
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