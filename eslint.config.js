import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const options = [
    // { languageOptions: { globals: globals.node } },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: ["test/*", "dist/*", "**/*.config.js"],
    },
    {
        languageOptions: {
            globals: { ...globals.node },
            ecmaVersion: 2020,
            sourceType: "module",
        },
    },
    {
        name: "Crawler",
        files: ["src/**/*.ts"],
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/ban-types": "warn",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_",
                    "caughtErrorsIgnorePattern": "^_",
                },
            ],
            "no-console": "error",
            "no-empty": ["error", { "allowEmptyCatch": true }],
            "quotes": ["error", "double"],
            "semi": ["error", "always"],
        },
    },
];

export default options;
