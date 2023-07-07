"use client";

import { useState } from "react";
import type { loginUser } from "./login-action";

type Props = {
	login: typeof loginUser; // infer types with `typeof`
};

const LoginForm = ({ login }: Props) => {
	const [response, setResponse] = useState(
		"fill in form and click on the log in button"
	);

	return (
		<>
			<form
				onSubmit={async (e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const input = Object.fromEntries(formData) as {
						username: string;
						password: string;
					};
					const res = await login(input); // this is the typesafe action called from client
					setResponse(JSON.stringify(res, null, 1));
				}}>
				<input
					type="text"
					name="username"
					id="username"
					placeholder="Username"
				/>
				<input
					type="password"
					name="password"
					id="password"
					placeholder="Password"
				/>
				<button type="submit">Log in</button>
			</form>
			<div id="response-container">
				<div>Action response:</div>
				<pre className="response">{response}</pre>
			</div>
		</>
	);
};

export default LoginForm;
