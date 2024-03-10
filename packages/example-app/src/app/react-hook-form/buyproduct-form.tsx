"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buyProduct } from "./buyproduct-action";
import { schema } from "./validation";

export default function BuyProductForm() {
	const { register, handleSubmit } = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
	});

	const [result, setResult] = useState<any>({});

	return (
		<>
			<form
				onSubmit={handleSubmit(async (data) => {
					const res = await buyProduct(data);
					setResult(res);
				})}>
				<input {...register("productId")} placeholder="Product ID" />
				<button type="submit">Buy product</button>
			</form>
			<div id="result-container">
				<div>Action result:</div>
				<pre className="result">
					{
						result // if got back a result,
							? JSON.stringify(result, null, 1)
							: "fill in form and click on the buy product button" // if action never ran
					}
				</pre>
			</div>
		</>
	);
}
