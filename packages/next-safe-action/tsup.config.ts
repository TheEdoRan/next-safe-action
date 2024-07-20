import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/*.ts", "src/adapters/*.ts"],
	bundle: false,
	format: ["esm"],
	clean: true,
	splitting: false,
	sourcemap: true,
	dts: true,
});
