import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".next*/**",
      ".vercel/**",
      "out/**",
      "build/**",
      "desktop-transcriber/**",
      "next-env.d.ts",
      "test-app.js",
    ],
  },
  {
    files: [
      "scripts/patchFsTimeouts.js",
      "scripts/run-eslint.js",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
