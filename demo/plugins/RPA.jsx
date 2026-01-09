// Will be fetched remotely in a real world scenario
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
    priority={ 10 }
    key={ 'RPA_Log' }
    label={ 'RPA Log' }
    render={ render }
  />;
};

export const RPALink = () => {

  const render = useCallback(({ output }) => {
    if (!output.variables?.RPA_Result) {
      return null;
    }

    return (
      <a
        className="link--external"
        href="https://camunda.com"
        target="_blank" rel="noreferrer"
      >
        View Script
      </a>
    );
  });

  return <TaskTesting.Link
    priority={ 10 }
    key={ 'RPA_ScriptLink' }
    render={ render }
  />;
};