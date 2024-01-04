import Link from "next/link";
import { loginUser } from "./login-action";
import LoginForm from "./login-form";

export const metadata = {
  title: "Action without auth",
};

export default function Home() {
  return (
    <>
      <Link href="/with-context">Go to /with-context</Link>
      <Link href="/hook">Go to /hook</Link>
      <Link href="/optimistic-hook">Go to /optimistic-hook</Link>
      <Link href="/form">Go to /form</Link>
      <Link href="/form-with-bind/123/">Go to /form-with-bind</Link>
      <Link href="/form-with-state">Go to /form-with-state</Link>
      <h1>Action without auth</h1>
      {/* Pass the typesafe mutation to Client Component */}
      <LoginForm login={loginUser} />
    </>
  );
}
