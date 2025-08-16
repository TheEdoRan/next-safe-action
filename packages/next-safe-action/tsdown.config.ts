import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/hooks.ts", "src/stateful-hooks.ts"],
	bundle: true,
	format: ["esm"],
	clean: true,
	sourcemap: true,
	dts: true,
});
