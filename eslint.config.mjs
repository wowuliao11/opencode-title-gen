import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import eslintConfigPrettier from "eslint-config-prettier"

export default tseslint.config(
  {
    ignores: ["dist/", "node_modules/", "coverage/"],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": "warn",
    },
  },

  // Must be last — disables ESLint rules that conflict with Prettier
  eslintConfigPrettier,
)
