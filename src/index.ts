import { createElement, Fragment, ReactNode } from "react";
import { SVG_ATTRIBUTES } from "./core/constants";
import {
  identity,
  isString,
  allowOnlyAttrs,
  allowOnlyTags,
  forbidAttrs,
  forbidTags,
} from "./core/utils";
import { renderNodes } from "./core/render";
import { parseHtml } from "./core/parser";
import { htmlAttrsMap, parseAttrs } from "./core/attributes";
import { ParseOptions, RenderOptions } from "./core/types";

const typeErrorMessage = "HTML must be a string";
const checkTypeError = (html: unknown, message: string) => {
  if (!isString(html)) throw new TypeError(message);
};

const parse = (html: string, options: ParseOptions = {}) => {
  let node: ReactNode = null;

  const _onError = options.onError || identity;
  const onError = (error: unknown) => _onError(error, { html });
  options.onError = onError;
  options.attrsMap = Object.assign({}, htmlAttrsMap, options.attrsMap);

  try {
    checkTypeError(html, typeErrorMessage);

    html = (options.sanitize || identity)(html);

    checkTypeError(html, "Sanitized " + typeErrorMessage);

    node = createElement(
      Fragment,
      {},
      renderNodes((options.parser || parseHtml)(html), options as RenderOptions)
    );
  } catch (error) {
    onError(error);
  }

  return node;
};

export * from "./core/types";

export {
  parse,
  parseAttrs,
  SVG_ATTRIBUTES,
  allowOnlyAttrs,
  allowOnlyTags,
  forbidAttrs,
  forbidTags,
};
