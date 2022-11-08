import { createElement, Fragment } from "react";
import { identity } from "./core/utils";
import { svgAttrsMap } from "./core/attributes";
import { renderNodes, renderNode } from "./core/render";
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
export { svgAttrsMap, renderNodes, renderNode, parse };
