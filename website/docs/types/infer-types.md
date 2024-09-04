---
sidebar_position: 1
description: Learn how to infer types with next-safe-action.
---

# Infer types

next-safe-action, since version 7.6.4, exports utility types for type inference. Here's a guide on how to use them.

Suppose we have declared this safe action client:

```typescript title="src/lib/safe-action.ts"
import { z } from "zod";
import { createSafeActionClient, createMiddleware } from "next-safe-action";
import { getSessionData } from "@/services/auth"

// Here we declare a standalone auth middleware.
export const authMiddleware = createMiddleware<{
  ctx: { sessionToken: string };
  metadata: { actionName: string };
}>().define(async ({ ctx, next }) => {
  const { sessionId, userId } = await getSessionData(ctx.sessionToken);

  return next({
    ctx: {
      sessionId,
      userId,
    },
  });
});

// Here we declare the safe action client.
export const actionClient = createSafeActionClient({
  defineMetadataSchema: () => {
    return z.object({
      actionName: z.string(),
    });
  },
  handleServerError: (e) => {
    console.error("Action error:", e.message);
    return {
      errorMessage: e.message,
    };
  },
})
  .use(async ({ next }) => {
    return next({
      ctx: {
        sessionToken: "someToken",
      },
    });
  })
  .use(authMiddleware);
```

And then this action function:

```typescript title="src/app/test-action.ts"
"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";

const testActionSchema = z.object({
  username: z.string(),
});

const testActionBindArgsSchemas: [email: z.ZodString, age: z.ZodNumber] = [z.string(), z.number()];

export const testAction = actionClient
  .use(authMiddleware)
  .schema(testActionSchema)
  .bindArgsSchemas(testActionBindArgsSchemas)
  .action(async () => {
    return {
      successful: true,
    };
  });
```

We'll use these exported functions in the following examples.

## `/`

The library exports several utility types from the root path that help you infer types of a safe action client, a middleware function or a safe action function.

Here's the list of utility types exported from `next-safe-action` path:
- `InferSafeActionFnInput`: infer input types of a safe action function
- `InferSafeActionFnResult`: infer result type of a safe action function
- `InferMiddlewareFnNextCtx`: infer the type of context returned by a middleware function using the `next` function
- `InferCtx`: infer the type of context of a safe action client, or the context passed to a middleware function 
- `InferMetadata`: infer the type of metadata of a safe action client or middleware function
- `InferServerError`: infer the type of the `serverError` of a safe action function, middleware function or safe action function

### Example

```typescript
import type {
  InferCtx,
  InferMetadata,
  InferMiddlewareFnNextCtx,
  InferSafeActionFnInput,
  InferSafeActionFnResult,
  InferServerError,
} from "next-safe-action";
import type { actionClient, authMiddleware } from "@/lib/safe-action";
import type { testAction } from "@/app/test-action";

// Use `InferSafeActionFnInput` to infer the input types of a safe action function.
// highlight-next-line
type inferredTestActionInput = InferSafeActionFnInput<typeof testAction>;
/*
{
  clientInput: {
    username: string;
  };
  bindArgsClientInputs: [email: string, age: number];
  parsedInput: {
    username: string;
  };
  bindArgsParsedInputs: [email: string, age: number];
}
*/

// Use `InferSafeActionFnResult` to infer the result type of a safe action function.
// highlight-next-line
type inferredTestActionResult = InferSafeActionFnResult<typeof testAction>;
/*
{
  data?: {
    successful: boolean;
  } | undefined;
  serverError?: string | undefined;
  validationErrors?: {
    _errors?: string[];
    username?: {
      _errors?: string[];
    } | undefined;
  } | undefined;
  bindArgsValidationErrors?: [email: { _errors?: string[] }, age: { _errors?: string[] }] | undefined;
}
*/

// Use `InferMiddlewareFnNextCtx` to infer the type of the context returned by a middleware function using
// the `next` function.
// highlight-next-line
type inferredAuthMiddlewareNextCtx = InferMiddlewareFnNextCtx<typeof authMiddleware>;
/*
{
  sessionId: string;
  userId: string;
}
*/

// Use `InferCtx` to infer the type of the context of a safe action client, or the context passed to a
// middleware function. Here's an example with a safe action client:
// highlight-next-line
type inferredSafeActionClientCtx = InferCtx<typeof actionClient>;
/*
{
  sessionToken: string;
} & {
  sessionId: string;
  userId: string;
}
*/

// Use `InferMetadata` to infer the type of the metadata of a safe action client or middleware function.
// Here's an example with a middleware function:
// highlight-next-line
type inferredMiddlewareMetadata = InferMetadata<typeof authMiddleware>;
/*
{
  actionName: string;
}
*/

// Use `InferServerError` to infer the type of the `serverError` of a safe action client, middleware function,
// or safe action function. Here's an example with a safe action:
// highlight-next-line
type inferredServerError = InferServerError<typeof testAction>;
/*
{
  errorMessage: string;
}
*/
```

## `/hooks`

The library also exports three types from the `/hooks` path that help you infer types when using `useAction`, `useOptimisticAction` and `useStateAction` hooks.

Here's a list of utility types exported from `next-safe-action/hooks`:

- `InferUseActionHookReturn`: infers the return type of the `useAction` hook - only works with actions defined using the [`action`](/docs/define-actions/instance-methods#action--stateaction) method
- `InferUseOptimisticActionHookReturn`: infers the return type of the `useOptimisticAction` hook - only works with stateless actions defined using the [`action`](/docs/define-actions/instance-methods#action--stateaction) method
- `InferUseStateActionHookReturn`: infers the return type of the `useStateAction` hook - only works with stateful actions defined using the [`stateAction`](/docs/define-actions/instance-methods#action--stateaction) method

### Example

```typescript
import type { testAction } from "@/app/test-action";

// Use `InferUseActionHookReturn` to infer the return type of the `useAction` hook with a provided
// safe action function.
// highlight-next-line
type inferredTestActionHookReturn = InferUseActionHookReturn<typeof testAction>;
/*
{
  execute: (input: { username: string }) => void;
  executeAsync: (input: { username: string }) => Promise<SafeActionResult>;
  input: { username: string };
  result: SafeActionResult;
  reset: () => void;
  status: HookActionStatus;
} & HookShorthandStatus
*/

// Use `InferUseActionHookReturn` to infer the return type of the `useOptimisticAction` hook with a provided
// safe action function. You can pass the server state as the second generic parameter, which defaults
// to `any`.
// highlight-start
type inferredTestActionOptimisticHookReturn = InferUseOptimisticActionHookReturn<
  typeof testAction,
  { myServerState: { foo: string } }
>;
// highlight-end
/*
{
  execute: (input: { username: string }) => void;
  executeAsync: (input: { username: string }) => Promise<SafeActionResult>;
  input: { username: string };
  result: SafeActionResult;
  reset: () => void;
  status: HookActionStatus;
  optimisticState: { myServerState: { foo: string } };
} & HookShorthandStatus
*/

// Use `InferUseStateActionHookReturn` to infer the return type of the `useStateAction` hook with a
// provided stateful safe action. In this case, by providing the type of `testAction` as the
// generic parameter will, the resulting type will be `never`, because `testAction` is not defined
// using `stateAction()` method. Supposing that we change the definition of the function to be stateful,
// the resulting type will be:
// highlight-next-line
type inferredTestActionStateHookReturn = InferUseStateActionHookReturn<typeof testAction>;
/*
{
  execute: (input: { username: string }) => void;
  input: { username: string };
  result: SafeActionResult;
  status: HookActionStatus;
} & HookShorthandStatus
*/
```