import { createElement, Fragment } from "react";
import { SVG_ATTRIBUTES } from "./core/constants";
import { identity } from "./core/utils";
import { renderNode, renderNodes, getNodeList } from "./core/render";
import { parseAttrs } from "./core/attributes";
import { ParseOptions } from "./core/types";

const emptyFragment = createElement(Fragment);
const typeErrorMessage = "HTML must be a string";

function checkTypeError(html: unknown, message: string) {
  if (typeof html !== "string") {
    throw new TypeError(message);
  }
}

function parse(html: string, options: ParseOptions = {}) {
  try {
    checkTypeError(html, typeErrorMessage);

    html = (options.sanitize || identity)(html);

    checkTypeError(html, "Sanitized " + typeErrorMessage);

    if (html)
      return createElement(
        Fragment,
        {},
        renderNodes(getNodeList(html), options)
      );
  } catch (error) {
    (options.onError || identity)(error);
  }

  return emptyFragment;
}

export * from "./core/types";
export { parse, parseAttrs, renderNodes, renderNode, SVG_ATTRIBUTES };
