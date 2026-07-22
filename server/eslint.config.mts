import antfu from "@antfu/eslint-config"

export default antfu(
  {
    formatters: true,
    ignores: [
      ".zed/**",
      "node_modules",
      "dist",
      "**/*.md",
      ".env",
      ".wakatime-project",
      ".gitignore",
      "src/db/migrations",
    ],
    stylistic: {
      indent: 2,
      quotes: "double",
      semi: false,
    },
    type: "app",
    typescript: true,
  },
  {
    rules: {
      "antfu/if-newline": "off",
      "antfu/no-top-level-await": "off",
      "antfu/top-level-function": "off",

      "jsonc/comma-dangle": "off",
      "jsonc/sort-keys": "warn",

      "no-console": "warn",

      "node/no-process-env": "error",
      "node/prefer-global/process": "off",

      "one-var": "off",

      "perfectionist/sort-imports": [
        "warn",
        { tsconfig: { rootDir: "." } },
      ],
      // "perfectionist/sort-objects": ["warn"],

      "pnpm/yaml-enforce-settings": "off",

      // "sort-keys": "warn",
      "style/arrow-parens": ["warn", "as-needed"],
      "style/brace-style": "off",
      "style/comma-dangle": ["warn", "only-multiline"],
      "style/indent": ["warn", 2, { offsetTernaryExpressions: true }],
      "style/member-delimiter-style": [
        "error",
        { multiline: { delimiter: "none" } },
      ],
      "style/object-curly-newline": ["warn"],
      "style/operator-linebreak": "off",
      "ts/consistent-type-definitions": "off",
    },
  },
  {
    files: ["src/index.ts"],
    rules: { "no-console": "off" },
  },
  {
    files: ["src/config/env.ts"],
    rules: { "node/no-process-env": "off" },
  },
  {
    files: ["eslint.config.*"],
    rules: {
      "perfectionist/sort-objects": ["warn"],
      "sort-keys": "warn",
    },
  }
)
