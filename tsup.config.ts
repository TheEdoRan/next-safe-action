import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/hook/index.ts"],
	format: ["esm"],
	clean: true,
	splitting: false,
	sourcemap: true,
	dts: true,
});
