import { createElement, Fragment } from "react";
import { identity } from "./core/utils";
import { renderNodes, renderNode } from "./core/render";
import { PureParseOptions } from "./core/types";

function parse(html: string, options: PureParseOptions = {}) {
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

export { parse, renderNodes, renderNode };
