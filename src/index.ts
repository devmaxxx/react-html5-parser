import { createParser } from "./core";
import { parseHtml } from "./parser/browser";

export * from "./core";
export const parse = createParser(parseHtml);
