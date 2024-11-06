import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
    {
        ignores: ["**/out", "**/dist", "**/*.d.ts"],
    },
    {
        files: ["src/**/*.ts"],
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },

        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest", // Updated to match current ECMAScript version
                sourceType: "module",
            },
        },

        rules: {
            
            "@typescript-eslint/naming-convention": [
                "warn",
                {
                    selector: "import",
                    format: ["camelCase", "PascalCase"],
                },
            ],

            "semi": ["warn", "always"], // Use the core ESLint `semi` rule
            curly: "warn",
            eqeqeq: "warn",
            "no-throw-literal": "warn",
        },
    },
];
