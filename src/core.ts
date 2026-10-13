import { SVG_ATTRIBUTES } from "./core/constants";
import { createParser } from "./core/parse";
import { getNodeList, renderNode, renderNodes } from "./core/render";
import { parseAttrs } from "./core/attributes";
import { ParseOptions } from "./core/types";

export * from "./core/types";
export { parseAttrs, renderNodes, renderNode, SVG_ATTRIBUTES };

export const parse = createParser<ParseOptions>((html, options) =>
  renderNodes(getNodeList(html), options)
);
