import React, { createContext, useState } from 'react';

import useSelectedElement from '../hooks/useSelectedElement.js';
import run from '../utils/run-task.js';

export const CamundaContext = createContext();

export function CamundaProvider({ children, injector, camundaApi }) {
  const [ loading, setLoading ] = useState(false);
  const [ log, setLog ] = useState([]);

  const { elementId, exampleData } = useSelectedElement(injector);

  const addLog = (elementId, message, type = 'info') => {
    setLog((prev) => ([ ...prev, {
      elementId,
      message,
      type
    } ]));
  };

  const runTask = async (input) => {

    setLoading(true);

    try {
      await run(elementId, input, camundaApi, addLog);
    } catch (error) {
      console.error('Error running task:', error);
      addLog(elementId, `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    elementId,
    exampleData,
    loading,
    log,
    runTask
  };

  return (
    <CamundaContext.Provider value={ contextValue }>
      {children}
    </CamundaContext.Provider>
  );
}