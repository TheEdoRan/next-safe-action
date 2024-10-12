---
sidebar_position: 4
description: Hook base utilities shared by all hooks.
---

# Hook base utils

Hook base utilities are a set of properties shared by all hooks.

## `executeOnMount?` \[deprecated\]

:::warning deprecated
This property is deprecated and will be removed in the next major version. Actions should be used only for data mutations, so executing them on component mount is not recommended.
:::

`executeOnMount` is an optional object that, if passed to the hook, will `execute` the action when the component is mounted. It expects an `input` property of the same type as the input of the action and an optional `delayMs` property, which is the number of milliseconds to wait before executing the action (defaults to 0).