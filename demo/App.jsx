import React, { useState, useRef, useEffect } from 'react';

import BpmnModeler from 'camunda-bpmn-js/lib/camunda-cloud/Modeler';
import 'camunda-bpmn-js/dist/assets/camunda-cloud-modeler.css';

import TaskTesting from '../lib';

import diagram from './diagram.bpmn';

import './style.css';

function App() {
  const modelerRef = useRef(null);

  const [ modeler, setModeler ] = useState(null);
  const [ tab, setTab ] = useState('test');

  const [ config, setConfig ] = useState({
    input: {},
    output: {}
  });

  useEffect(() => {
    setTimeout(() => {

      // simulate fetching config asynchronously
      setConfig({
        input: {
          'ServiceTask_1': '{\n  "foo": "bar"\n}'
        },
        output: {
          'ServiceTask_1': {
            success: true,
            variables: {
              foo: 'baz'
            }
          }
        }
      });
    }, 2000);
  }, []);

  useEffect(() => {
    if (modelerRef.current) {
      setModeler(new BpmnModeler({
        container: '#canvas',
        propertiesPanel: {
          parent: '#properties'
        }
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

  const props = {
    injector,
    deploy: () => {
      console.log('Deploying...');
    },
    startInstance: () => {
      console.log('Starting instance...');
    },
    getInstance: () => {
      console.log('Getting instance...');
    },
    config,
    saveConfig: (config) => setConfig(config)
  };

  return (
    <>
      <div className="modeler" ref={ modelerRef }>
        <div id="canvas" className="canvas"></div>
        <div id="properties" className="properties-panel"></div>
      </div>
      <div className="bottom-panel">
        <div className="bottom-panel_tabs">
          <div className={ `bottom-panel_tabs-item ${tab === 'problems' ? 'active' : ''}` } onClick={ () => setTab('problems') }>
            Problems
          </div>
          <div className={ `bottom-panel_tabs-item ${tab === 'test' ? 'active' : ''}` } onClick={ () => setTab('test') }>
            Task testing
          </div>
        </div>
        <div className="bottom-panel_tabs-content">
          {tab === 'problems' && <ProblemsTab />}
          {tab === 'test' && <TestTab { ...props } />}
        </div>
      </div>
    </>
  );
}

function TestTab(props) {
  const { injector } = props;

  if (!injector) {
    return <div>Loading...</div>;
  }

  return <TaskTesting { ...props } />;
}

function ProblemsTab() {
  return <div style={ { padding: '10px' } }>I got 99 problems but running a single task ain&apos;t one.</div>;
}

export default App;