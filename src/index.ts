import Dom from "dompurify";
import { PureParseOptions } from "./core/types";
import { parse as pureParse, renderNode, renderNodes } from "./pure";

type Options = PureParseOptions & {
  domConfig?: Omit<Dom.Config, "RETURN_DOM" | "RETURN_DOM_FRAGMENT">;
};

function parse(html: string, options: Options = {}) {
  return pureParse(html, {
    sanitize: (str) => Dom.sanitize(str, options.domConfig || {}),
    ...options,
  });
}

export { parse, renderNode, renderNodes };
