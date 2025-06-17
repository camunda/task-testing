import { useState, useEffect } from 'react';
import classNames from 'classnames';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import Test from './Test';

export default function TaskTesting(props) {

  const {
    injector,
    saveFile, // onAction('save') from Desktop Modeler
    file
  } = props;

  const [ input, setInput ] = useState('');
  const [ loading, setLoading ] = useState(false);
  const [ selectedElement, setSelectedElement ] = useState(null);
  const [ test, setTest ] = useState(null);
  const [ testResults, setTestResults ] = useState({});

  useEffect(() => {
    const _test = new Test(injector, file);

    setTest(_test);

    _test.getInput().then((input) => {
      setInput(input);
    });
  }, []);

  useEffect(() => {
    injector.get('eventBus').on('selection.changed', ({ newSelection }) => {
      if (newSelection.length === 1 && is(newSelection[0], 'bpmn:Task')) {
        setSelectedElement(newSelection[0]);
      } else {
        setSelectedElement(null);
      }
    });
  }, []);

  useEffect(() => {
    const callback = ({ element }) => {
      if (testResults[element.id]) {
        setTestResults({
          ...testResults,
          [ element.id ]: null
        });
      }
    };

    injector.get('eventBus').on('element.changed', callback);

    return () => {
      injector.get('eventBus').off('element.changed', callback);
    };
  }, [ testResults ]);

  useEffect(() => {

    // get input for selected element from local storage
    if (selectedElement) {
      const storedInput = localStorage.getItem(`test-input-${selectedElement.id}`);
      if (storedInput) {
        setInput(storedInput);
      }
    }
  }, [ selectedElement ]);

  useEffect(() => {

    // set input for selected element in local storage
    if (selectedElement && input) {
      localStorage.setItem(`test-input-${selectedElement.id}`, input);
    }
  }, [ input ]);

  const onTest = async () => {
    if (!test) {
      return;
    }

    setLoading(true);

    saveFile();

    setTestResults({
      ...testResults,
      [ selectedElement.id ]: null
    });

    const results = await test.run(selectedElement.id, input, (getProcessInstanceResult) => {
      if (getProcessInstanceResult.success) {
        setTestResults({
          ...testResults,
          [ selectedElement.id ]: getProcessInstanceResult
        });
      } else {
        setTestResults({
          ...testResults,
          [ selectedElement.id ]: getProcessInstanceResult
        });
      }
    });

    console.log('test results', results);

    setTestResults({
      ...testResults,
      [ selectedElement.id ]: results
    });

    setLoading(false);
  };

  console.log('test results', testResults);

  if (!selectedElement) {
    return <div className="placeholder">Select a task to test.</div>;
  }

  return (
    <div className="task-testing">
      <div className="input-output">
        <div className="input">
          <div className="input-header">
            <h5>Input</h5>
            <button className={
              classNames('btn', {
                'btn-primary': !testResults[selectedElement.id],
                'btn-secondary': testResults[selectedElement.id]
              })
            } onClick={ onTest } disabled={ loading }>{ loading ? 'Running...' : testResults[selectedElement.id] ? 'Run' : 'Run' }</button>
          </div>
          <div className="input-content">
            <textarea spellCheck="false" rows="10" onChange={ (e) => setInput(e.target.value) } value={ input }></textarea>
          </div>
        </div>
        <div className="output">
          <div className="output-header">
            <h5>Output</h5>
            <button className="btn btn-secondary">Save as example output data</button>
          </div>
          <div className="output-content">
            {
              testResults[selectedElement.id] && (
                <>
                  {
                    testResults[selectedElement.id].type === 'instanceStarted' && <span>Instance started...</span>
                  }
                  {
                    testResults[selectedElement.id].type === 'instanceNotFound' && <span>Waiting for Operate 😴...</span>
                  }
                  {
                    testResults[selectedElement.id].type === 'instanceFound' && (
                      <pre>{ JSON.stringify(testResults[selectedElement.id].response.response.variables, null, 2) }</pre>
                    )
                  }
                </>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}