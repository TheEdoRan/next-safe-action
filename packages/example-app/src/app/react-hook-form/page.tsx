import Link from "next/link";
import BuyProductForm from "./buyproduct-form";

export const metadata = {
	title: "Action using React Hook Form",
};

export default function ReactHookForm() {
	return (
		<>
			<Link href="/">Go to home</Link>
			<h1>Action using React Hook Form</h1>
			<BuyProductForm />
		</>
	);
}
