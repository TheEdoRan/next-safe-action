---
sidebar_position: 4
description: Safe action client is the instance that you can use to create typesafe actions.
---

# Safe action client

The safe action client instance is created by the `createSafeActionClient()` function. The instance is used to create safe actions, as you have already seen in previous sections of the documentation. You can create multiple clients too, for different purposes, as explained [in this section](/docs/recipes/extending-base-client).

You can also provide functions to the client, to customize the behavior for every action you then create with it. We will explore them in detail in the following sections.

Here's a reference of all the available optional functions:

| Function name                | Purpose                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `handleReturnedServerError?` | When an error occurs on the server after executing the action on the client, it lets you define custom logic to returns a custom `serverError` instead of the default string. More information [here](/docs/safe-action-client/initialization-options#handlereturnedservererror).               |
| `handleServerErrorLog?`      | When an error occurs on the server after executing the action on the client, it lets you define custom logic to log the error on the server. By default the error is logged via `console.error`. More information [here](/docs/safe-action-client/initialization-options#handleservererrorlog). |
