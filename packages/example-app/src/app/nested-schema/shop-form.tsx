"use client";

import { useState } from "react";
import { buyProduct } from "./shop-action";

const ShopForm = () => {
	const [result, setResult] = useState(
		"fill in form and click on the log in button"
	);

	return (
		<>
			<form
				onSubmit={async (e) => {
					e.preventDefault();

					// Change one of these two to generate validation errors.
					const userId = crypto.randomUUID();
					const productId = crypto.randomUUID();

					const res = await buyProduct({
						user: { id: userId },
						product: { deeplyNested: { id: productId } },
					}); // this is the typesafe action called from client

					setResult(JSON.stringify(res, null, 1));
				}}>
				<button type="submit">Buy product</button>
			</form>
			<div id="result-container">
				<div>Action result:</div>
				<pre className="result">{result}</pre>
			</div>
		</>
	);
};

export default ShopForm;
