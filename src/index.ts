import * as p from "./core/parser";
import { render } from "./core/render";
import { Options } from "./core/types";

export default function parse(html: p.Html, options: Options = {}) {
  if (typeof html !== "string") return;

  const doc = p.parse(html, options.config || {});

  return render(doc, options);
}
