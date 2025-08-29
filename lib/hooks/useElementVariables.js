import { useContext } from 'react';

import { ElementVariablesContext } from '../contexts/ElementVariablesContext';

export function useElementVariables() {
  const context = useContext(ElementVariablesContext);

  return context;
}