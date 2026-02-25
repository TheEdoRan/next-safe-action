// @ts-check
import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default tseslint.config(
	globalIgnores(["**/*.js", "**/*.mjs", "**/*.cjs", "dist/**"]),
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			"react-hooks": reactHooks,
		},
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
			"react-hooks/exhaustive-deps": "warn",
			"@typescript-eslint/require-await": "off",
		},
	}
);
