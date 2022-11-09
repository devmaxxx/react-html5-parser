import { createElement, Fragment } from "react";
import { SVG_ATTRIBUTES } from "./core/constants";
import { identity } from "./core/utils";
import { renderNode, renderNodes } from "./core/render";
import { parseAttrs } from "./core/attributes";
import { ParseOptions } from "./core/types";

function parse(html: string, options: ParseOptions = {}) {
  if (!(typeof html === "string" && html)) return createElement(Fragment);

  const sanitize = options.sanitize || identity;
  const template = document.createElement("template");
  template.innerHTML = sanitize(html);

  return createElement(
    Fragment,
    {},
    renderNodes(template.content.childNodes, options)
  );
}

export * from "./core/types";
export { parse, parseAttrs, renderNodes, renderNode, SVG_ATTRIBUTES };
