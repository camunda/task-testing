import { CodeSnippetSkeleton, Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import { PluginContext } from '../shared/plugins';
import OutputEditor from './OutputEditor';
import { has, isObject } from 'min-dash';
import { SCOPES } from '../../TaskExecution';
import { useCallback, useContext, useEffect } from 'react';

export function OutputVariables({
  isTaskExecuting,
  output,
  element
}) {

  if (isTaskExecuting) {
    return <CodeSnippetSkeleton className="output__variables--skeleton" type="multi" />;
  }

  if (!output) {
    return <div className="output__variables--empty">
      <div>
        Enter process variables, then click <span className="output__variables--empty-action">Test task</span> to see how they change once the task has executed.
      </div>
    </div>;
  }

  if (output?.error) {
    return <OutputEditor
      value={ output?.error.response || 'No error details available' }
    />;
  }


  return (<>
    <ProcessVariablesTab />
    <LocalVariablesTab />
    <IncidentTab />
    <OutputTabs element={ element } output={ output } isTaskExecuting={ isTaskExecuting } />
  </>
  );
}

/**
 * @param {Object} props
 * @param {string} props.label - The tab label to display
 * @param {Function} [props.render=() => null] - Function that renders the
 * component
 * @param {React.ReactNode} [props.children] - Static content to render
 * @param {number} [props.priority=1000] - Priority for sorting, higher
 * priority means the tab is rendered left of the lower priority tabs
 *
 * @returns {null}
 */
export const OutputTab = ({ children = null, render = () => null, label, priority = 1000 }) => {
  const { registerPlugin, unregisterPlugin } = useContext(PluginContext);

  useEffect(() => {
    const tab = { label, render, children, priority, slot: 'output_tab' };
    registerPlugin(tab);

    return () => {
      unregisterPlugin(tab);
    };
  }, [ children, render, label, priority, registerPlugin, unregisterPlugin ]);

  return null;
};

const OutputTabs = (props) => {
  const { getPlugins } = useContext(PluginContext);

  const tabPlugins = getPlugins('output_tab');

  const tabsToRender = tabPlugins
    .map(tab => ({
      label: tab.label,
      content: tab.render(props)
    }))
    .filter(tab => tab.content);

  return (
    <Tabs>
      <TabList>
        { tabsToRender.map((tab, index) => (
          <Tab key={ index }>{ tab.label }</Tab>
        )) }
      </TabList>
      <TabPanels>
        { tabsToRender.map((tab, index) => {
          return (
            <TabPanel key={ index }>
              { tab.content }
            </TabPanel>
          );
        }) }
      </TabPanels>
    </Tabs>
  );
};

const IncidentTab = () => {

  const render = useCallback(({ output }) => {
    if (!output?.incident) {
      return;
    }

    return <IncidentDetails incident={ output.incident } />;
  }, []);

  return <OutputTab
    priority={ 3000 }
    label="Incident"
    render={ render }
  />;
};

const ProcessVariablesTab = () => {
  const render = useCallback(({ output }) => {
    if (!output || (!output.success && !output.incident)) {
      return;
    }

    return <OutputEditor value={ JSON.stringify(pickVariables(output.variables, SCOPES.PROCESS), null, 2) } />;
  }, []);

  return <OutputTab
    priority={ 2000 }
    label="Process Variables"
    render={ render }
  />;
};

const LocalVariablesTab = () =>
{
  const render = useCallback(({ output }) => {
    if (!output || (!output.success && !output.incident)) {
      return;
    }

    return <OutputEditor value={ JSON.stringify(pickVariables(output.variables, SCOPES.LOCAL), null, 2) } />;
  }, []);

  return <OutputTab
    priority={ 1000 }
    label="Local Variables"
    render={ render }
  />;
};


function IncidentDetails({ incident }) {
  const {
    errorType,
    errorMessage,
    creationTime,
    ...rest
  } = incident;

  return (
    <div className="output__incident--details">
      <div>
        <span className="bold">Type: </span>
        {errorType}
      </div>
      <div>
        <span className="bold">Creation Time: </span>
        {new Date(creationTime).toLocaleString()}
      </div>
      <div>
        <pre>
          <span className="bold">Message: </span>
          {errorMessage}
        </pre>
      </div>

      { Object.entries(rest).map(([ key, value ]) => (
        <div key={ key }>
          <span className="bold">{capitalize(key)}:</span> {value}
        </div>
      )) }
    </div>
  );
}


/**
 * Capitalize a string, adding spaces before capital letters.
 *
 * @example
 *
 * capitalize('fooBar'); // Foo Bar
 *
 * @param {string} string
 *
 * @returns {string}
 */
function capitalize(string) {
  return string.replace(/([A-Z])/g, ' $1').replace(/^./, (match) => match.toUpperCase());
}

/**
 * Pick variables for a given scope. Variables in legacy format are ignored.
 *
 * @param {import('../../types').ElementOutputVariables} variables
 * @param {string} scope
 *
 * @returns {Object}
 */
export function pickVariables(variables, scope) {
  return Object.values(variables).reduce((acc, variable) => {

    // Ignore variables in legacy formats
    // see https://github.com/camunda/task-testing/issues/12 and https://github.com/camunda/task-testing/issues/48 for legacy format
    if (isObject(variable) && has(variable, 'name') && scope === variable.scope) {
      acc[variable.name] = variable.value;
    }

    return acc;
  }, {});
}