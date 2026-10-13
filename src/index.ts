import { Config } from "dompurify";
import { createParser } from "./core/parse";
import { purifyTree } from "./core/purify";
import { getNodeList, renderNodes } from "./core/render";
import { ParseOptions } from "./core/types";

export * from "./core";

export type PurifyConfig = Config;
export type SanitizedParseOptions = ParseOptions & {
  // Merged over this entry's DOMPurify config; its keys replace ours.
  purify?: PurifyConfig;
};

// DOMPurify runs even after a caller's own `sanitize`: a function passed to
// trim or rewrite the HTML must not turn the default sanitizer off. The core
// entry is the way to opt out.
export const parse = createParser<SanitizedParseOptions>((html, options) =>
  renderNodes(
    getNodeList(html, (root) => purifyTree(root, options, options.purify)),
    options
  )
);
