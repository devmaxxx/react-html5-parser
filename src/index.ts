import Dom from "dompurify";
import { PureParseOptions } from "./core/types";
import pureParse from "./pure";

type Options = PureParseOptions & {
  domConfig?: Omit<Dom.Config, "RETURN_DOM" | "RETURN_DOM_FRAGMENT">;
};

export default function parse(html: string, options: Options = {}) {
  return pureParse(html, {
    sanitize: (str) => Dom.sanitize(str, options.domConfig || {}),
    ...options,
  });
}
