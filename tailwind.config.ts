import type { Config } from "tailwindcss";
/* Tailwind is included per the stack requirement. Preflight is off because the
   approved stylesheet supplies its own resets; enabling it would alter output. */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
export default config;
