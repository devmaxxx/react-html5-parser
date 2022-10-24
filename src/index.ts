import { render } from "./render";
import * as p from "./parser";
import { Options } from "./types";

export default function parse(html: p.Html, options: Options = {}) {
  if (typeof html !== "string") return [];

  const doc = p.parse(html, options.config || {});

  return render(doc.childNodes, options);
}
