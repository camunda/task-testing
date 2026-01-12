import { useCallback } from 'react';

import TaskTesting from '../../lib';
import logHtml from './log.html';

export const RPATab = () => {
  const render = useCallback(({ output }) => {

    if (!output.variables?.RPA_Result) {
      return;
    }

    return <iframe width="100%" srcDoc={ logHtml } />;
  }, []);

  return <TaskTesting.Tab
    priority={ 0 }
    label={ 'RPA Log' }
    render={ render }
  />;
};

export const RPALink = () => {
  const getVisible = useCallback(({ output }) => {
    return !!output?.variables?.RPA_Result;
  }, []);

  return <TaskTesting.Link
    priority={ 10000 }
    href="https://camunda.com"
    target="_blank"
    visible={ getVisible }
  >View script</TaskTesting.Link>;
};