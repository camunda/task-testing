# @camunda/task-testing

[![CI](https://github.com/camunda/task-testing/actions/workflows/CI.yml/badge.svg)](https://github.com/camunda/task-testing/actions/workflows/CI.yml)

Run and test a single building block of your BPMN diagram.

## Try it

[Demo](https://scaling-chainsaw-lro45v3.pages.github.io/)

## Usage

The library exposes a single React component:

```js
import TaskTesting from '@camunda/task-testing';
```

The configuration is passed via the [props of the TaskTesting component](https://github.com/camunda/task-testing/blob/fa1d39874f532e669adec7d7a76aaf0fd99e0e5a/lib/components/TaskTesting/TaskTesting.js#L50).

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