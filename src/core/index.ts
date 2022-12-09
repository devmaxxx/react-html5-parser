import { createElement, Fragment, ReactNode } from "react";
import { SVG_ATTRIBUTES } from "./constants";
import {
  identity,
  isString,
  allowOnlyAttrs,
  allowOnlyTags,
  forbidAttrs,
  forbidTags,
} from "./utils";
import { renderNodes } from "./render";
import { htmlAttrsMap, parseAttrs } from "./attributes";
import { ParseOptions, ParserFn } from "./types";

const typeErrorMessage = "HTML must be a string";
const checkTypeError = (html: unknown, message: string) => {
  if (!isString(html)) throw new TypeError(message);
};

const createParser =
  (parser: ParserFn) =>
  (html: string, options: ParseOptions = {}) => {
    let node: ReactNode = null;

    const onError = (error: unknown) =>
      (options.onError || identity)(error, { html });

    try {
      checkTypeError(html, typeErrorMessage);

      html = (options.sanitize || identity)(html);

      checkTypeError(html, "Sanitized " + typeErrorMessage);

      node = createElement(
        Fragment,
        {},
        renderNodes(
          parser(html),
          Object.assign({}, options, {
            attrsMap: Object.assign({}, htmlAttrsMap, options.attrsMap),
            onError,
          })
        )
      );
    } catch (error) {
      onError(error);
    }

    return node;
  };

export * from "./types";

export {
  createParser,
  parseAttrs,
  SVG_ATTRIBUTES,
  allowOnlyAttrs,
  allowOnlyTags,
  forbidAttrs,
  forbidTags,
};
