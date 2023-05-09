import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/hook.ts"],
	format: ["esm"],
	clean: true,
	splitting: false,
	sourcemap: true,
	dts: true,
});
