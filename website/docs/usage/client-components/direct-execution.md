---
sidebar_position: 1
description: You can execute safe actions by directrly calling them inside Client Components.
---

# 1. Direct execution

The first way to execute Server Actions inside Client Components is by importing it and directly calling it in a function. This method is the simplest one, but in some cases it could be all you need, for example if you just need the action result inside an `onClick` or `onSubmit` handlers, without overcomplicating things:

```tsx
export default function Login({ loginUser }: Props) {
  return (
    <button
      onClick={async () => {
        // Result is scoped to this function.
        const result = await loginUser({ username: "johndoe", password: "123456" });

       // You can do something with it here.
      }}>
      Log in
    </button>
  );
}
```

### Action result object

Every action you execute returns an object with the same structure. This is described in the [action result object](/docs/usage/action-result-object) section.

Explore a working example [here](https://github.com/TheEdoRan/next-safe-action/tree/main/packages/example-app/src/app/(examples)/direct).