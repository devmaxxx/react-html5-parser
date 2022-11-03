import { createElement, Fragment } from "react";
import { render } from "./core/render";
import { Options } from "./core/types";

export default function parse(
  html: string,
  options: Omit<Options, "config"> = {}
) {
  if (!(typeof html === "string" && html)) return createElement(Fragment);

  const template = document.createElement("template");
  template.innerHTML = html;

  return render(template.content, options);
}
