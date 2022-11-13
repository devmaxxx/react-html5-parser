import { createElement, Fragment } from "react";
import { SVG_ATTRIBUTES } from "./core/constants";
import { identity } from "./core/utils";
import { renderNode, renderNodes } from "./core/render";
import { parseAttrs } from "./core/attributes";
import { ParseOptions } from "./core/types";

function parse(html: string, options: ParseOptions = {}) {
  if (!(typeof html === "string" && html)) return createElement(Fragment);

  const sanitize = options.sanitize || identity;
  const container = document.createElement("div");
  container.innerHTML = sanitize(html);

  const nodeList: Node[] = [];

  container.childNodes.forEach((item) => nodeList.push(item));

  return createElement(Fragment, {}, renderNodes(nodeList, options));
}

export * from "./core/types";
export { parse, parseAttrs, renderNodes, renderNode, SVG_ATTRIBUTES };
