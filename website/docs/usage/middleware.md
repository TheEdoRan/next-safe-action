---
sidebar_position: 3
description: Learn how to use middleware functions in your actions.
---

# Middleware

WIP: finish this

next-safe-action has, since version 7, a composable middleware system, which allows you to create functions for almost every kind of use case you can imagine. It works very similarly to the [tRPC implementation](https://trpc.io/docs/server/middlewares), with some minor differences.

Middleware functions are defined using [`use`](/docs/safe-action-client/instance-methods#use) method in your action clients, via the `middlewareFn` argument, that has the following structure:

## Middleware function arguments

### `next` function

## Middleware function return value

`middlewareFn` returns a [`MiddlewareResult`](/docs/types#middlewareresult) object. It extends the result of a safe action with `success` property, and `parsedInput` and `ctx` optional properties. This is the exact return type of the [`next`](#next-function) function, so you must always return it to continue executing the middleware chain.

## Instance level middleware

## Action level middleware