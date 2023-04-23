// This is used to copy package.json and LICENSE files into dist/ folder, for
// publish.

const { copyFileSync } = require("fs");
const { join } = require("path");

const distDir = join(__dirname, "dist");

const main = () => {
	const copyFile = (file) => {
		const from = join(__dirname, file);
		const to = join(__dirname, "dist", file);

		copyFileSync(from, to);
		console.log("Copied", file, "to dist/ folder");
	};

	copyFile("package.json");
	copyFile("LICENSE");
	copyFile("README.md");
};

main();
