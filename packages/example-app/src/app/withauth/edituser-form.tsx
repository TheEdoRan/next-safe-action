"use client";

import { useState } from "react";
import type { editUser } from "./edituser-action";

type Props = {
	edit: typeof editUser; // infer types with `typeof`
};

const EditUserForm = ({ edit }: Props) => {
	const [response, setResponse] = useState(
		"fill in form and click on the update profile button"
	);

	return (
		<>
			<form
				onSubmit={async (e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const input = Object.fromEntries(formData) as {
						fullName: string;
						age: string;
					};
					const res = await edit(input); // this is the typesafe action called from client
					setResponse(JSON.stringify(res, null, 1));
				}}>
				<input
					type="text"
					name="fullName"
					id="fullName"
					placeholder="Full name"
				/>
				<input type="text" name="age" id="age" placeholder="Age" />
				<button type="submit">Update profile</button>
			</form>
			<div id="response-container">
				<div>Action response:</div>
				<pre className="response">{response}</pre>
			</div>
		</>
	);
};

export default EditUserForm;
