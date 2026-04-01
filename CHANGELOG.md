# Changelog

All notable changes are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

* `FIX`: update empty states to match design system ([#93](https://github.com/camunda/task-testing/pull/93))

## 4.0.0

* `FEAT`: pre-fill variables in input editor ([#87](https://github.com/camunda/task-testing/pull/87))
* `FEAT`: support undo-redo in input editor ([#87](https://github.com/camunda/task-testing/pull/87))
* `FIX`: show waiting states for child elements inside subprocesses ([#92](https://github.com/camunda/task-testing/pull/92))
* `FIX`: fix execution log order by using causal ordering for state entries and related entries with same timestamp ([#91](https://github.com/camunda/task-testing/pull/91))
* `FIX`: move waiting states out of log so they are always visible when existing ([#91](https://github.com/camunda/task-testing/pull/91))

### Breaking Changes

* `TaskExecutionApi` methods `getProcessInstanceJobs`, `getProcessInstanceUserTasks`, and `getProcessInstanceMessageSubscriptions` no longer accept an `elementId` parameter. The process instance is already scoped to the selected element via `startInstructions` and `TERMINATE_PROCESS_INSTANCE`, making the `elementId` filter redundant for simple tasks and broken for subprocesses.

## 3.0.0

* `FEAT`: support testing ad-hoc subprocess children ([#79](https://github.com/camunda/task-testing/pull/79))
* `FEAT`: show execution log in the task testing panel tracking process execution step by step ([#81](https://github.com/camunda/task-testing/pull/81))
* `FEAT`: persist execution log ([#81](https://github.com/camunda/task-testing/pull/81))
* `FEAT`: show CTA for active jobs, message subscriptions, and user tasks ([#81](https://github.com/camunda/task-testing/pull/81))
* `CHORE`: migrate from `@camunda8/sdk` to `@camunda8/orchestration-cluster-api` ([#81](https://github.com/camunda/task-testing/pull/81))
* `CHORE`: consolidate task testing events ([#81](https://github.com/camunda/task-testing/pull/81))

### Breaking Changes

* `taskExecution.status.changed` event replaced by `taskExecution.state.changed`
* `taskExecution.error` event removed; errors now surfaced via `taskExecution.finished` with `reason: 'error'`
* `taskExecution.interrupted` event removed; replaced by `taskExecution.finished` with `reason: 'user.selectionChanged'`
* `onTaskExecutionFinished` callback now receives a `TaskExecutionFinishedResult` object (not the old output shape)
* `onTaskExecutionInterrupted` prop removed
* `TaskExecutionApi` requires three new methods: `getProcessInstanceJobs`, `getProcessInstanceMessageSubscriptions`, `getProcessInstanceUserTasks`

## 2.2.0

* `FEAT`: bundle and export types ([#74](https://github.com/camunda/task-testing/pull/74))

## 2.1.0

* `FEAT`: add plugin functionality to allow custom tabs and links ([#40](https://github.com/camunda/task-testing/pull/40))

## 2.0.1

* `FIX`: do not show error banner action if `onConfigureConnection` not provided ([#66](https://github.com/camunda/task-testing/pull/66))

## 2.0.0

* `FEAT`: improve readability of incident details ([#63](https://github.com/camunda/task-testing/pull/63))
* `FEAT`: add `onTestTask` prop for parent component to control flow when _Test task_ clicked ([#65](https://github.com/camunda/task-testing/pull/65))
* `FEAT`: add optional _Configure_ button ([#65](https://github.com/camunda/task-testing/pull/65))
* `FIX`: create process instance by key instead of ID ([#61](https://github.com/camunda/task-testing/pull/61))

### Breaking Changes

* The `api.startInstance` function signature changed. The first argument is now the process definition key instead of the process definition ID. See https://github.com/camunda/task-testing/pull/61 for more information.

## 1.0.5

* `FIX`: do not show autocompletion in nested properties ([#60](https://github.com/camunda/task-testing/pull/60))
* `FIX`: show autocompletion value for boolean values ([#60](https://github.com/camunda/task-testing/pull/60))
* `FIX`: do not show local task variables in the autocompletion ([#60](https://github.com/camunda/task-testing/pull/60))

## 1.0.4

* `FIX`: make output loading animation take full width ([#56](https://github.com/camunda/task-testing/pull/56))

## 1.0.3

* `FIX`: do not show Operate button on error state ([#52](https://github.com/camunda/task-testing/pull/52))

## 1.0.2

* `FIX`: mark tasks in ad-hoc sub-process as unsupported ([#50](https://github.com/camunda/task-testing/pull/50))
* `FIX`: handle variables with the same name in process and local scope ([#48](https://github.com/camunda/task-testing/issues/48))

## 1.0.1

* `FIX`: allow no trailing slashes when providing Operate base URL ([#47](https://github.com/camunda/task-testing/pull/47))

## 1.0.0

* `FEAT`: always show __View in Operate__ button ([#43](https://github.com/camunda/task-testing/pull/43))
* `FIX`: display process and local variables separately ([#41](https://github.com/camunda/task-testing/pull/41))
* `FIX`: allow trailing slashes when providing Operate base URL ([#43](https://github.com/camunda/task-testing/pull/43))

### Breaking Changes

* `api` prop of the `TaskTesting` component now requires a `getProcessInstanceElementInstances` callback to separate process and local variables

## 0.2.8

* `FIX`: do not cancel task execution on every diagram change ([#32](https://github.com/camunda/task-testing/issues/32))
* `FIX`: cancel execution when switching between different diagrams ([#38](https://github.com/camunda/task-testing/pull/38))
* `FIX`: react to Operate URL change from modeler ([camunda/camunda-modeler#5290](https://github.com/camunda/camunda-modeler/issues/5290))

## 0.2.7

* `FIX`: use provided variable resolver ([#33](https://github.com/camunda/task-testing/pull/33))

## 0.2.6

* `FIX`: call configure connection callback when clicking _Test task_ and connection not configured ([#25](https://github.com/camunda/task-testing/pull/25))
* `FIX`: do not prefill inputs based on input parameters ([#26](https://github.com/camunda/task-testing/pull/26))
* `FIX`: always render input editor regardless of content ([#28](https://github.com/camunda/task-testing/pull/28))
* `FIX`: indicate unsupported element selection ([#29](https://github.com/camunda/task-testing/pull/29))
* `FIX`: display same type as properties panel ([camunda/camunda-modeler#5299](https://github.com/camunda/camunda-modeler/issues/5299))

## 0.2.5

* re-release of 0.2.4

## 0.2.4

* `FIX`: don't show Operate URL if configuration error ([65e80b](https://github.com/camunda/task-testing/commit/65e80b6223a1d1def4f6ac0e6c03e241f2ae7f44))

## 0.2.3

* `FIX`: call `onTaskExecutionStarted` before the execution
* `FIX`: properly unsubscribe from `taskExecution.interrupted` event
* `FIX`: change incident error type property to `errorType`

## 0.2.2

* `FIX`: remove `operateUrl` from output if execution canceled
* `FIX`: only emit `taskExecution.interrupted` if execution is in progress

## 0.2.1

* `FIX`: properly handle canceling execution at every stage ([#19](https://github.com/camunda/task-testing/pull/19))
* `DEPS`: update to `@bpmn-io/variable-resolver@1.3.4`

## 0.2.0

* `FEAT`: show current execution state in results ([#9](https://github.com/camunda/task-testing/pull/9))
* `FEAT`: add link to Operate ([#9](https://github.com/camunda/task-testing/pull/9))
* `FEAT`: show process variables for incidents ([#9](https://github.com/camunda/task-testing/pull/9))
* `FEAT`: make result process variables a code editor with syntax highlights ([#9](https://github.com/camunda/task-testing/pull/9))
* `FIX`: make sure `InputEditor` rerenders when selected element changes ([#17](https://github.com/camunda/task-testing/pull/17))

## 0.1.1

Initial release
