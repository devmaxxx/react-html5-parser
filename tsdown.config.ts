import { defineConfig, type UserConfig } from "tsdown";

const entries = ["src/index.ts", "src/core.ts", "src/native.ts"];

const shared: UserConfig = {
  platform: "neutral",
  dts: true,
  // Builds run in parallel; the build script empties dist/ once up front.
  clean: false,
};

// htmlparser2 is a devDependency on purpose: the native entry ships it
// bundled, so web users never install it.
const bundleHtmlparser2: UserConfig["deps"] = {
  onlyBundle: ["htmlparser2", "domhandler", "domelementtype", "entities"],
};

export default defineConfig([
  { ...shared, entry: entries, format: "esm", deps: bundleHtmlparser2 },
  // One build per CJS entry: with shared chunks, rolldown parks the interop
  // helpers in index.cjs and makes core.cjs and native.cjs require it, which
  // drags DOMPurify into both.
  ...entries.map(
    (entry): UserConfig => ({
      ...shared,
      entry,
      format: "cjs",
      deps: entry === "src/native.ts" ? bundleHtmlparser2 : undefined,
    })
  ),
]);
