import { useState, useEffect, useRef } from 'react';

import useSelectedElement from '../../hooks/useSelectedElement';

import Test from '../../utils/Test';

import Variables from '../Variables/Variables';
import Output from '../Output/Output';

import './TabContent.scss';


export default function TabContent(props) {

  const {
    injector,
    saveFile,
  } = props;

  const [ loading, setLoading ] = useState(false);
  const [ log, setLog ] = useState([]);

  const element = useSelectedElement(injector);

  const utilRef = useRef(null);

  useEffect(() => {
    const {
      deploy,
      startInstance,
      getInstance
    } = props;

    utilRef.current = new Test(
      deploy,
      startInstance,
      getInstance
    );
  }, []);

  const addLog = (elementId, message) => {
    setLog((prev) => ([ ...prev, {
      elementId,
      message
    } ]));
  };

  const handleTest = async (input) => {
    setLoading(true);

    saveFile();

    await utilRef.current.run(
      element.id,
      input,
      addLog);

    setLoading(false);
  };

  return (
    <div className="task-testing">
      <Variables onRun={ handleTest } element={ element } loading={ loading } />
      <Output log={ log } />
    </div>
  );
}