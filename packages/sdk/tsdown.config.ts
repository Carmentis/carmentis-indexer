export default {
  entry: ["src/index.ts"],
  outDir: "dist",
  dts: true,
  format: ["esm", "cjs"],
  noExternal: ["@cmts-dev/carmentis-indexer-common"]
};
