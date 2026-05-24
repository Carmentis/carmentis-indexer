export default {
  entry: ["src/index.ts"],
  outDir: "dist",
  dts: true,
  format: ["esm", "cjs"],
  treeshake: false,
  deps: {
    alwaysBundle: ["@cmts-dev/carmentis-indexer-common"]
  }
};
