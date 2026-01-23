import { useCallback } from 'react';

import TaskTesting from '../../lib';

export const FooTabDynamic = () => {
  const render = useCallback(({ output }) => {
    return <div>Dynamic tab: { output?.variables ? `${ JSON.stringify(output.variables).substring(0, 10) }...` : '-' }</div>;
  }, []);

  return <TaskTesting.Tab
    priority={ 0 }
    label={ 'Foo Dynamic' }
    render={ render }
  />;
};

export const FooTabStatic = () => {
  return <TaskTesting.Tab
    priority={ 0 }
    label={ 'Foo Static' }
  >Static Tab</TaskTesting.Tab>;
};

export const FooLinkDynamic = () => {
  const render = useCallback(({ output }) => {
    return <div>Dynamic link: { output?.variables ? `${ JSON.stringify(output.variables).substring(0, 10) }...` : '-' }</div>;
  }, []);

  return <TaskTesting.Link
    priority={ 10000 }
    href="https://camunda.com"
    target="_blank"
    render={ render }
  />;
};

export const FooLinkStatic = () => {
  return <TaskTesting.Link
    priority={ 10000 }
    href="https://camunda.com"
    target="_blank"
  >Static Link</TaskTesting.Link>;
};