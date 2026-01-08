import { CodeSnippetSkeleton, Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import { Fill, Slot } from '../shared/SlotFill';
import OutputEditor from './OutputEditor';
import { has, isObject } from 'min-dash';
import { SCOPES } from '../../TaskExecution';

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
    <Slot name="output" element={ element } output={ output } isTaskExecuting={ isTaskExecuting } RenderIn={ OutputTabs } />
  </>
  );
}

const OutputTabs = ({ fills }) => {
  return (
    <Tabs>
      <TabList>
        { fills.map((fill, index) => (
          <Tab key={ index }>{ fill.label }</Tab>
        )) }
      </TabList>
      <TabPanels>
        { fills.map((fill, index) => (
          <TabPanel key={ index }>
            { fill.content }
          </TabPanel>
        )) }
      </TabPanels>
    </Tabs>
  );
};

const IncidentTab = () => (
  <Fill
    priority={ 300 }
    slot="output"
    getFill={ ({ output }) => {
      if (!output?.incident) {
        return;
      }

      return {
        label: 'Incident',
        content: <IncidentDetails incident={ output.incident } />
      };
    } }
  />
);

const ProcessVariablesTab = () => (
  <Fill
    priority={ 200 }
    slot="output"
    getFill={ ({ output }) => {
      if (!output || (!output.success && !output.incident)) {
        return;
      }

      return {
        label: 'Process Variables',
        content: <OutputEditor value={ JSON.stringify(pickVariables(output.variables, SCOPES.PROCESS), null, 2) } />
      };
    } }
  />
);

const LocalVariablesTab = () => (
  <Fill
    priority={ 100 }
    slot="output"
    getFill={ ({ output }) => {
      if (!output || (!output.success && !output.incident)) {
        return;
      }

      return {
        label: 'Local Variables',
        content: <OutputEditor value={ JSON.stringify(pickVariables(output.variables, SCOPES.LOCAL), null, 2) } />
      };
    } }
  />
);


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