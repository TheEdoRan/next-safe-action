// @ts-check
const { defineConfig } = require("eslint-define-config");

module.exports = defineConfig({
	root: true,
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended-type-checked", "prettier"],
	plugins: ["@typescript-eslint", "react-hooks"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: "./tsconfig.json",
		tsconfigRootDir: __dirname,
	},
	ignorePatterns: ["**/*.js", "**/*.mjs", "**/*.cjs", "dist/**"],
	rules: {
		"@typescript-eslint/consistent-type-imports": "error",
		"@typescript-eslint/consistent-type-exports": "error",
		"@typescript-eslint/unbound-method": "off",
		"@typescript-eslint/ban-ts-comment": "off",
		"@typescript-eslint/no-redundant-type-constituents": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-unsafe-function-type": "off",
		"@typescript-eslint/no-empty-object-type": "off",
		"@typescript-eslint/prefer-promise-reject-errors": "off",
		"@typescript-eslint/only-throw-error": "off",
		"@typescript-eslint/ban-types": "off",
		"react-hooks/exhaustive-deps": "warn",
		"@typescript-eslint/require-await": "off",
	},
});
