import React, { useState } from 'react';

import { Link } from '@carbon/react';
import { Launch } from '@carbon/icons-react';

import CodeEditor from '../CodeEditor/CodeEditor';

import RunButton from './components/RunButton';
import ExampleDataButton from './components/ExampleDataButton';

import useCamundaContext from '../../hooks/useCamundaContext';

export default function Variables() {

  const [ value, setValue ] = useState('{\n}');
  const [ error, setError ] = useState(false);

  const { runTask, exampleData } = useCamundaContext();

  const handleRun = () => {
    runTask(value);
  };

  const handleExampleData = () => {
    setValue(exampleData);
  };

  return (
    <div className="section task-testing__variables">
      <div className="section-header header">
        <div className="section-header__info">
          <div>
            <span>Input variables</span>
            <Link
              href="https://docs.camunda.io/docs/components/concepts/variables"
              renderIcon={ () => <Launch size="14" /> } />
          </div>
          <p className="cds--label">
            {'Enter process variables as JSON. To run a task, select it on the canvas and click Run.'}
          </p>
        </div>
        <div className="section-header__buttons">
          <RunButton
            onClick={ handleRun }
            error={ error }
          />
          <ExampleDataButton onClick={ handleExampleData } />
        </div>
      </div>
      <div className="editor">
        <CodeEditor
          value={ value }
          onChange={ setValue }
          onErrorChange={ setError }
        />
      </div>
    </div>
  );
}
