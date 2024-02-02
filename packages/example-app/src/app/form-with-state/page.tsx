"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { count } from "./count-action";

export default function CounterPage() {
  const [state, action] = useFormState(count, { data: 0 });
  return (
    <>
      <Link href="/">Go to home</Link>
      <form action={action}>
        <p>Count: {state.data}</p>
        <input type="number" name="step" min={0} defaultValue={1} />
        <button type="submit">Increment</button>
      </form>
    </>
  );
}
