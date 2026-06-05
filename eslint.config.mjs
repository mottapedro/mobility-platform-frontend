import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // Playwright fixtures use a parameter named `use` that the React Hook lint
    // mistakes for the `use()` hook. E2E files are Node tests, not React.
    files: ["e2e/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
]);

export default eslintConfig;
