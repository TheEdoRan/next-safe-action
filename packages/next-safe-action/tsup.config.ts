import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/hooks.ts", "src/stateful-hooks.ts"],
	bundle: true,
	format: ["esm"],
	clean: true,
	splitting: false,
	sourcemap: true,
	dts: true,
});
