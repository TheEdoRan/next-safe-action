---
sidebar_position: 5
description: Action result object is the result of an action execution.
---

# Action result object

Here's how action result object is structured (all keys are optional):


| Name               | When                                                   | Value                                                                                                                                                                                                                                                               |
|--------------------|--------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `data?`            | Execution is successful.                               | What you returned in action's server code.                                                                                                                                                                                                                          |
| `validationErrors?` | Input data doesn't pass validation.                         | An object whose keys are the names of the fields that failed validation. Each key's value is either an `ErrorList` or a nested key with an `ErrorList` inside.<br />`ErrorList` is defined as: `{ errors?: string[] }`.<br />It follows the same structure as [Zod's `format` function](https://zod.dev/ERROR_HANDLING?id=formatting-errors).
| `bindArgsValidationErrors?` | Bind arguments inputs don't pass validation.                         | An array of objects that mirrors the bind schemas array passed to [`bindArgsSchemas`](/docs/safe-action-client/instance-methods#bindargsschemas). Each key's value is either an `ErrorList`, a nested key with an `ErrorList` inside, or `null`.<br />`ErrorList` is defined as: `{ errors?: string[] }`.<br />It follows the same structure as [Zod's `format` function](https://zod.dev/ERROR_HANDLING?id=formatting-errors).
| `serverError?`     | An error occurs during action's server code execution. | A generic type that by default is the string "Something went wrong while executing the operation." for every server error that occurs, but this is [configurable](/docs/safe-action-client/initialization-options#handlereturnedservererror) when instantiating a new client. |