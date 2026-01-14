# @camunda/task-testing

[![CI](https://github.com/camunda/task-testing/actions/workflows/CI.yml/badge.svg)](https://github.com/camunda/task-testing/actions/workflows/CI.yml)

Run and test a single building block of your BPMN diagram.

## Usage

```js
import TaskTesting from '@camunda/task-testing';

function App() {
  ...

  <TaskTesting api={ ... }>
    <TaskTesting.Tab label={ 'Foo' }>...</TaskTesting.Tab>;
    <TaskTesting.Link href="https://camunda.com">Foo</TaskTesting.Link>;
  </TaskTesting>
}
```

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