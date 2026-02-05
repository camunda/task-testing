# @camunda/task-testing

[![CI](https://github.com/camunda/task-testing/actions/workflows/CI.yml/badge.svg)](https://github.com/camunda/task-testing/actions/workflows/CI.yml)

Run and test a single building block of your BPMN diagram.

## Usage

```js
import TaskTesting from '@camunda/task-testing';

function App() {
  ...

  <TaskTesting 
    api={ ... }
    onTaskExecutionStarted={ (element) => { ... } }
    onTaskExecutionFinished={ (element, result) => { ... } }
  >
    <TaskTesting.Tab label={ 'Foo' }>...</TaskTesting.Tab>;
    <TaskTesting.Link href="https://camunda.com">Foo</TaskTesting.Link>;
  </TaskTesting>
}
```

### Props

#### Lifecycle Callbacks

The TaskTesting component provides callbacks to track task execution lifecycle events:

- **`onTaskExecutionStarted(element)`** - Called when a task execution begins
  - `element` - The BPMN element being tested

- **`onTaskExecutionFinished(element, result)`** - Called when task execution ends (success, incident, or cancellation)
  - `element` - The BPMN element that was tested
  - `result` - Execution result object:
    - When `success: true`: Contains `variables` with execution output
    - When `success: false`: Contains `reason` explaining why:
      - `'incident'` - Task completed with an incident (includes `incident` and optional `variables`)
      - `'user.cancel'` - User clicked cancel button
      - `'user.selectionChanged'` - User selected a different element
      - `'error'` - Deployment or start instance failed (includes `error` object)

[See demo](https://github.com/camunda/task-testing/tree/main/demo)

## Development

Install the dependencies and spin up a local server at [http://localhost:3000](http://localhost:3000):

```
npm install

npm start
```

It requires a Camunda 8 instance to run.

We recommend using [Camunda 8 Run](https://docs.camunda.io/docs/self-managed/quickstart/developer-quickstart/c8run/) for development.

You can configure your Camunda 8 environment in the `demo/.env` file.

## Build

Run all tests and build the library:

```
npm run all
```

## License 

MIT