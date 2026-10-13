import { createElement, Fragment, ReactNode } from "react";
import { identity } from "./utils";
import { BaseParseOptions } from "./types";

const typeErrorMessage = "HTML must be a string";

function checkTypeError(html: unknown, message: string) {
  if (typeof html !== "string") {
    throw new TypeError(message);
  }
}

// Shared by the web and native entries: they differ only in how a string
// becomes React nodes, not in validation or error reporting.
export function createParser<T extends BaseParseOptions>(
  render: (html: string, options: T) => ReactNode
) {
  return function parse(html: string, options?: T | null): ReactNode {
    // `null` passes a default parameter by, and would throw in the catch.
    const parseOptions = options || ({} as T);
    let node: ReactNode = null;

    try {
      checkTypeError(html, typeErrorMessage);

      html = (parseOptions.sanitize || identity)(html);

      checkTypeError(html, "Sanitized " + typeErrorMessage);

      node = createElement(Fragment, {}, html && render(html, parseOptions));
    } catch (error) {
      const onError = parseOptions.onError;

      if (typeof onError == "function") {
        onError(error, html);
      }
    }

    return node;
  };
}
