"use client";

import { useState } from "react";
import { loginUser } from "./login-action";

const LoginForm = () => {
	const [result, setResult] = useState(
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
					const res = await loginUser(input); // this is the typesafe action called from client
					setResult(JSON.stringify(res, null, 1));
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
			<div id="result-container">
				<div>Action result:</div>
				<pre className="result">{result}</pre>
			</div>
		</>
	);
};

export default LoginForm;
