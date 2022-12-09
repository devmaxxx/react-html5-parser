import { createParser } from "./core";
import { parseHtml } from "./parser/node";

export * from "./core";
export const parse = createParser(parseHtml);
