import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["agentation-entry.jsx"],
  bundle: true,
  outfile: "dist/agentation-bundle.js",
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  jsx: "automatic",
  jsxImportSource: "react",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  minify: true,
  sourcemap: true,
  logLevel: "info",
});
