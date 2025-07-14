import { useContext } from 'react';

import { CamundaContext } from '../context/CamundaContext.js';

export default function useCamundaContext() {
  const { elementId, exampleData, loading, log, runTask } = useContext(CamundaContext);

  return {
    elementId,
    exampleData,
    loading,
    log,
    runTask
  };
}