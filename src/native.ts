import { parseDocument } from "htmlparser2";
import { createParser } from "./core/parse";
import { renderHtml } from "./native/render";
import { NativeParseOptions } from "./native/types";

export * from "./native/types";

export const parse = createParser<NativeParseOptions>((html, options) =>
  renderHtml(parseDocument(html).children, options)
);
