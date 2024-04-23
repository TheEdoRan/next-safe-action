"use client";

import { ResultBox } from "@/app/_components/result-box";
import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { StyledInput } from "@/app/_components/styled-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buyProduct } from "./buyproduct-action";
import { schema } from "./validation";

export default function ReactHookFormPage() {
	const { register, handleSubmit } = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
	});

	const [result, setResult] = useState<any>({});

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action using React Hook Form</StyledHeading>
			<form
				className="flex flex-col mt-8 space-y-4"
				onSubmit={handleSubmit(async (data) => {
					const res = await buyProduct(data);
					setResult(res);
				})}>
				<StyledInput {...register("productId")} placeholder="Product ID" />
				<StyledButton type="submit">Buy product</StyledButton>
			</form>
			<ResultBox result={result} />
		</main>
	);
}
