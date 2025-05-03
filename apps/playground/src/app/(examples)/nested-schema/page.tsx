"use client";

import { StyledButton } from "@/app/_components/styled-button";
import { StyledHeading } from "@/app/_components/styled-heading";
import { useAction } from "next-safe-action/hooks";
import { ResultBox } from "../../_components/result-box";
import { buyProduct } from "./shop-action";

export default function NestedSchemaPage() {
	const { execute, result, status } = useAction(buyProduct);

	return (
		<main className="w-96 max-w-full px-4">
			<StyledHeading>Action using nested schema</StyledHeading>
			<form
				className="flex flex-col mt-8 space-y-4"
				onSubmit={async (e) => {
					e.preventDefault();

					// Change one of these two to generate validation errors.
					const userId = crypto.randomUUID();
					const productId = crypto.randomUUID();

					execute({
						user: { id: userId },
						product: { deeplyNested: { id: productId } },
					}); // this is the typesafe action called from client
				}}
			>
				<StyledButton type="submit">Buy product</StyledButton>
			</form>
			<ResultBox result={result} status={status} />
		</main>
	);
}
