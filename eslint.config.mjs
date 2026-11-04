import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  ...nextVitals,
  ...nextTypescript,
  { ignores: [".next/**", "next-env.d.ts", "node_modules/**", "public/**", "assets/**"] },
];
