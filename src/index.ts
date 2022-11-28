import { createElement, Fragment, ReactNode } from "react";
import { SVG_ATTRIBUTES } from "./core/constants";
import { identity } from "./core/utils";
import { renderNode, renderNodes } from "./core/render";
import { parseHtml } from "./core/parser";
import { parseAttrs } from "./core/attributes";
import { ParseOptions } from "./core/types";

const typeErrorMessage = "HTML must be a string";
function checkTypeError(html: unknown, message: string) {
  if (typeof html !== "string") {
    throw new TypeError(message);
  }
}

function parse(html: string, options: ParseOptions = {}) {
  let node: ReactNode = null;

  try {
    checkTypeError(html, typeErrorMessage);

    html = (options.sanitize || identity)(html);

    checkTypeError(html, "Sanitized " + typeErrorMessage);

    node = createElement(
      Fragment,
      {},
      html && renderNodes((options.parser || parseHtml)(html), options)
    );
  } catch (error) {
    const onError = options.onError;

    if (onError?.call) {
      onError(error, html);
    }
  }

  return node;
}

export * from "./core/types";
export { parse, parseAttrs, renderNodes, renderNode, SVG_ATTRIBUTES };
