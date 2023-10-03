---
sidebar_position: 1
---

# 1. Direct execution

The first way to execute Server Actions inside Client Components is by passing the action from a Server Component to a Client Component and directly calling it in a function. This method is the most simple one, but it can be useful in some cases, for example if you just need the action result inside an `onClick` or `onSubmit` handler, without overcomplicating things:

```tsx
export default function Login({ loginUser }: Props) {
  return (
    <button
      onClick={async () => {
        const result = await loginUser({ username: "johndoe", password: "123456" });
        // Result is scoped to this function. You can do something with it here.
      }}>
      Log in
    </button>
  );
}
```

### Action result object

Every action you execute returns an object with the same structure. This is described in the [action result object](/docs/usage-from-client/action-result-object) section.

Explore a working example [here](https://github.com/TheEdoRan/next-safe-action/tree/main/packages/example-app/src/app).