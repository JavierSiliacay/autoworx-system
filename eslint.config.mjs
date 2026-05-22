import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "dist/**",
      ".electron-builder-cache/**",
    ],
  },
];

export default eslintConfig;
