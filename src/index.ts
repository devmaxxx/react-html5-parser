import { createElement, Fragment } from "react";
import { sanitize } from "./core/sanitizer";
import { render } from "./core/render";
import { Options } from "./core/types";

export default function parse(html: string, options: Options = {}) {
  if (!(typeof html === "string" && html)) return createElement(Fragment);

  const doc = sanitize(html, options.config || {});

  return render(doc, options);
}
