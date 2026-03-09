# @camunda/task-testing

[![CI](https://github.com/camunda/task-testing/actions/workflows/CI.yml/badge.svg)](https://github.com/camunda/task-testing/actions/workflows/CI.yml)

Run and test a single building block of your BPMN diagram.

## Usage

```js
import TaskTesting from '@camunda/task-testing';

function App() {
  ...

  <TaskTesting
    { ...props }
  >
    <TaskTesting.Tab label="My dynamic tab" render={ ({ output }) => <div>...</div> } />
    <TaskTesting.Tab label="My static tab">My static content</TaskTesting.Tab>
    <TaskTesting.Link href="https://example.com" render={ ({ output }) => <div>...</div> } />
    <TaskTesting.Link href="https://example.com">My static link</TaskTesting.Link>
  </TaskTesting>
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `injector` | `Object` | yes | The [didi](https://github.com/nikku/didi) injector from the bpmn-js modeler |
| `api` | `TaskExecutionApi` | yes | API object with methods for deploying, starting instances, and polling |
| `isConnectionConfigured` | `boolean` | yes | Whether a Camunda 8 connection is configured |
| `config` | `Config` | no | Input/output configuration for elements |
| `onConfigChanged` | `(config: Config) => void` | no | Called when the configuration changes |
| `configureConnectionBannerTitle` | `string` | no | Title for the connection banner (default: `'Connection required'`) |
| `configureConnectionBannerDescription` | `string` | no | Description for the connection banner (default: `'Configure a connection to start testing.'`) |
| `configureConnectionLabel` | `string` | no | Label for the configure connection button (default: `'Configure'`) |
| `onConfigureConnection` | `Function` | no | Called when the user clicks the configure connection button |
| `onTestTask` | `() => boolean \| Promise<boolean>` | no | Called when the user clicks _Test task_. Return `true` to proceed, `false` to abort |
| `operateBaseUrl` | `string` | no | Base URL for Operate links |
| `tasklistBaseUrl` | `string` | no | Base URL for Tasklist links |
| `documentationUrl` | `string` | no | URL for the documentation link |
| `onTaskExecutionStarted` | `(element) => void` | no | Called when task execution starts |
| `onTaskExecutionFinished` | `(element, result) => void` | no | Called when task execution ends |

#### `TaskExecutionApi`

The `api` prop must implement the following methods. Each method should return a `{ success: true, response }` or `{ success: false, error }` object.

| Method | Description |
|--------|-------------|
| `deploy()` | Deploy the process definition |
| `startInstance(processDefinitionKey, elementId, variables)` | Start a process instance |
| `getProcessInstance(processInstanceKey)` | Search for a process instance |
| `getProcessInstanceElementInstances(processInstanceKey)` | Search element instances |
| `getProcessInstanceIncident(processInstanceKey)` | Search incidents |
| `getProcessInstanceJobs(processInstanceKey, elementId)` | Search jobs |
| `getProcessInstanceMessageSubscriptions(processInstanceKey, elementId)` | Search message subscriptions |
| `getProcessInstanceUserTasks(processInstanceKey, elementId)` | Search user tasks |
| `getProcessInstanceVariables(processInstanceKey)` | Search variables |

#### `onTaskExecutionFinished` result

The `result` parameter is a discriminated union:

- **`success: true`** — Task completed successfully. Contains `lastPolledResult` and `processInstanceKey`.
- **`success: false`** — Task did not complete successfully. Contains `reason`:
  - `'incident'` — An incident occurred (includes `incident` details)
  - `'terminated'` — Process instance was terminated
  - `'user.cancel'` — User clicked cancel
  - `'user.selectionChanged'` — User selected a different element
  - `'error'` — Deployment or start failed (includes `error` with `message`)

#### Plugins

Custom tabs and links can be added as children:

- **`<TaskTesting.Tab>`** — Adds a tab to the output panel
  - `label` (string, required) — Tab label
  - `render` (function) — Render function receiving `{ output }`, for dynamic content
  - `children` (ReactNode) — Static content (alternative to `render`)
  - `priority` (number, default `1000`) — Higher priority tabs appear first

- **`<TaskTesting.Link>`** — Adds a link to the output header
  - `href` (string, required) — Link URL
  - `target` (string) — Link target (e.g. `'_blank'`)
  - `render` (function) — Render function receiving `{ output }`, for dynamic content
  - `children` (ReactNode) — Static content (alternative to `render`)
  - `priority` (number, default `1000`) — Higher priority links appear first

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