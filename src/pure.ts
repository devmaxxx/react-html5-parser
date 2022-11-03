import { createElement, Fragment } from "react";
import { renderNodes } from "./core/render";
import { PureParseOptions } from "./core/types";

export default function parse(html: string, options: PureParseOptions = {}) {
  if (!(typeof html === "string" && html)) return createElement(Fragment);

  const sanitize = options.sanitize;
  const template = document.createElement("template");
  template.innerHTML = sanitize ? sanitize(html) : html;

  return createElement(
    Fragment,
    {},
    renderNodes(template.content.childNodes, options)
  );
}
