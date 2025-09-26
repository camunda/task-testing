# Changelog

All notable changes are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

* `FIX`: call configure connection callback when clicking _Test task_ and connection not configured ([#25](https://github.com/camunda/task-testing/pull/25))
* `FIX`: do not prefill inputs based on input parameters ([#26](https://github.com/camunda/task-testing/pull/26))
* `FIX`: always render input editor regardless of content ([#28](https://github.com/camunda/task-testing/pull/28))
* `FIX`: indicate unsupported element selection ([#29](https://github.com/camunda/task-testing/pull/29))
' `FIX`: display same type as properties panel ([]())

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