import Dom from "dompurify";
import { RenderOptions } from "./core/types";
import { parse as pureParse, renderNode, renderNodes } from "./";

type Options = RenderOptions & {
  config?: Omit<Dom.Config, "RETURN_DOM" | "RETURN_DOM_FRAGMENT">;
};

function parse(html: string, options: Options = {}) {
  return pureParse(html, {
    ...options,
    sanitize: (str) => Dom.sanitize(str, options.config || {}),
  });
}

export { parse, renderNode, renderNodes };
