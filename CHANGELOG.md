# Changelog

All notable changes are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

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
