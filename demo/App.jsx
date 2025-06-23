import { useState, useRef, useEffect } from 'react';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

import TaskTesting from '../lib';

import {
  saveFile,
  deploymentConfig,
  deployResources,
  createProcessInstance,
  getProcessInstance
} from '../test/mock';

import diagram from './diagram.bpmn?raw';

import './App.css';

function App() {

  // Prevent multiple modeler instances from React.StrictMode running useEffect twice
  const initialized = useRef(false);

  const modelerRef = useRef(null);

  const [ modeler, setModeler ] = useState(null);

  useEffect(() => {
    if (modelerRef.current && !initialized.current) {
      setModeler(new BpmnModeler({
        container: modelerRef.current,
        additionalModules: [
        ]
      }));

      initialized.current = true;
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
    deploymentConfig,
    deployResources,
    createProcessInstance,
    getProcessInstance
  };

  return (
    <>
      <div className="modeler" ref={ modelerRef }></div>
      <div className="bottom-panel">
        {injector && <TaskTesting { ...props } />}
      </div>
    </>
  );
}

export default App;