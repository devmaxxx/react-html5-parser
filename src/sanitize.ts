import Dom from "dompurify";
import { ParseOptions } from "./core/types";
import { parse as pureParse, renderNode, renderNodes } from "./";

type Options = ParseOptions & {
  config?: Omit<Dom.Config, "RETURN_DOM" | "RETURN_DOM_FRAGMENT">;
};

function parse(html: string, options: Options = {}) {
  return pureParse(html, {
    sanitize: (str) => Dom.sanitize(str, options.config || {}),
    ...options,
  });
}

export { parse, renderNode, renderNodes };
