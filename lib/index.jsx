import React, { useState } from 'react';

import useSelectedElement from './hooks/useSelectedElement';

import Variables from './components/Variables/Variables';
import Output from './components/Output/Output';

import run from './utils/run-task';

import './style.css';

/**
 * @param {Object} props
 * @returns {import('react').ReactElement}
 */
export default function TaskTesting(props) {

  const {
    injector,
    deploy,
    startInstance,
    getInstance
  } = props;

  const [ loading, setLoading ] = useState(false);
  const [ log, setLog ] = useState([]);

  const element = useSelectedElement(injector);

  const addLog = (elementId, message) => {
    setLog((prev) => ([ ...prev, {
      elementId,
      message
    } ]));
  };

  const handleTest = async (input) => {

    const camundaApi = { deploy, startInstance, getInstance };

    setLoading(true);

    await run(element.id, input, camundaApi, addLog);

    setLoading(false);
  };

  return (
    <div className="task-testing">
      <Variables onRun={ handleTest } element={ element } loading={ loading } />
      <Output log={ log } />
    </div>
  );
}