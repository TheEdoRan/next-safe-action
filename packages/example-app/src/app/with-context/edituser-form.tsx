"use client";

import { useState } from "react";
import { editUser } from "./edituser-action";

const EditUserForm = () => {
	const [result, setResult] = useState(
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
					const res = await editUser(input); // this is the typesafe action called from client
					setResult(JSON.stringify(res, null, 1));
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
			<div id="result-container">
				<div>Action result:</div>
				<pre className="result">{result}</pre>
			</div>
		</>
	);
};

export default EditUserForm;
