import React, { useState, useRef, useEffect } from 'react';

import BpmnModeler from 'camunda-bpmn-js/lib/camunda-cloud/Modeler';
import 'camunda-bpmn-js/dist/assets/camunda-cloud-modeler.css';

import TaskTesting from '../lib';

import {
  deploy,
  startInstance,
  getInstance,
  saveFile
} from '../test/mock';

import diagram from './diagram.xml';

import './style.css';

function App() {
  const modelerRef = useRef(null);

  const [ modeler, setModeler ] = useState(null);
  const [ tab, setTab ] = useState('debugger');

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
    saveFile,
    deploy,
    startInstance,
    getInstance
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
          <div className={ `bottom-panel_tabs-item ${tab === 'debugger' ? 'active' : ''}` } onClick={ () => setTab('debugger') }>
            Debugger
          </div>
        </div>
        <div className="bottom-panel_tabs-content">
          {tab === 'problems' && <ProblemsTab />}
          {tab === 'debugger' && <DebuggerTab { ...props } />}
        </div>
      </div>
    </>
  );
}

function DebuggerTab(props) {
  const { injector } = props;

  if (!injector) {
    return <div>Loading...</div>;
  }

  return <TaskTesting { ...props } />;
}

function ProblemsTab() {
  return <div style={ { padding: '10px' } }>I got 99 problems but debugging ain&apos;t one.</div>;
}


export default App;