import { useState, useEffect, useRef } from 'react';

import useSelectedElement from '../hooks/useSelectedElement';

import Test from '../utils/Test';

import './TabContent.scss';

export default function TabContent(props) {

  console.log('task-testing: TabContent props', props);

  const {
    injector,
    saveFile,
  } = props;

  const [ input, setInput ] = useState('{\n\n}');
  const [ loading, setLoading ] = useState(false);
  const [ log, setLog ] = useState([]);

  const element = useSelectedElement(injector);

  const utilRef = useRef(null);

  useEffect(() => {
    const {
      deployResources,
      startInstance,
      getProcessInstance
    } = props;

    utilRef.current = new Test(
      deployResources,
      startInstance,
      getProcessInstance
    );
  }, []);

  const addLog = (elementId, message) => {
    setLog((prev) => ([ ...prev, {
      elementId,
      message
    } ]));
  };

  const onTest = async () => {
    setLoading(true);

    saveFile();

    await utilRef.current.run(
      element.id,
      input,
      addLog);

    setLoading(false);
  };

  if (!element) {
    return <div className="placeholder">Select a task to test.</div>;
  }

  return (
    <div className="task-testing">
      <div className="input-output">
        <div className="input">
          <div className="input-header">
            <h5>Input</h5>
            <button
              className="btn btn-primary"
              onClick={ onTest }
              disabled={ loading }>
              { loading ? 'Running...' : 'Run Test' }
            </button>
          </div>
          <div className="input-content">
            <textarea id="task-testing-input" spellCheck="false" rows="10" onChange={ (e) => setInput(e.target.value) } value={ input }></textarea>
          </div>
        </div>
        <div className="output">
          <div className="output-header">
            <h5>Output</h5>
            <button className="btn btn-secondary">Save as example output data</button>
          </div>
          <div className="output-content">
            {
              log.map((entry, index) => (
                <div key={ index } className="log-entry">
                  <pre><strong>{ entry.elementId }:</strong> { entry.message }</pre>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}