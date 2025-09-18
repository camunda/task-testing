# Changelog

All notable changes are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

## 0.2.2

- `FIX`: remove `operateUrl` from output if execution canceled
- `FIX`: only emit `taskExecution.interrupted` if execution is in progress

## 0.2.1

- `FIX`: properly handle canceling execution at every stage ([#19](https://github.com/camunda/task-testing/pull/19))
- `DEPS`: update to `@bpmn-io/variable-resolver@1.3.4`

## 0.2.0

- `FEAT`: show current execution state in results ([#9](https://github.com/camunda/task-testing/pull/9))
- `FEAT`: add link to Operate ([#9](https://github.com/camunda/task-testing/pull/9))
- `FEAT`: show process variables for incidents ([#9](https://github.com/camunda/task-testing/pull/9))
- `FEAT`: make result process variables a code editor with syntax highlights ([#9](https://github.com/camunda/task-testing/pull/9))
- `FIX`: make sure `InputEditor` rerenders when selected element changes ([#17](https://github.com/camunda/task-testing/pull/17))

## 0.1.1

Initial release