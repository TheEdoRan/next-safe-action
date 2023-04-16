// This is needed because Next.js files with server functions must have
// the "use server" directive at the start of file.

const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const pathDir = join(__dirname, "dist");

const main = () => {
	const fixFile = (path) => {
		let rows = readFileSync(path).toString().split("\n");
		rows.unshift('"use server";');
		writeFileSync(path, rows.join("\n"));

		console.log("Fixed", path);
	};

	fixFile(join(pathDir, "index.js"));
	fixFile(join(pathDir, "index.mjs"));
};

main();
