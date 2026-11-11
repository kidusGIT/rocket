import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "es",
      sourcemap: true,
    },
    {
      file: "dist/index.umd.cjs",
      format: "umd",
      name: "RocketAnimation",
      sourcemap: true,
      exports: "named",
    },
  ],
  plugins: [
    nodeResolve({
      extensions: [".mjs", ".js", ".json", ".node", ".ts"],
    }),
    typescript({ tsconfig: "./tsconfig.json" }),
  ],
};
