import React from "react";
import { render } from "@testing-library/react";
import * as main from "../src";
import * as core from "../src/core";

// Inputs a browser parses without complaint; none of them may make `parse`
// report an error or make React throw while rendering the result.
const hostileInputs: [string, string][] = [
  ["invalid attribute names", '<div a"b="1" 1x="2" =x>t</div>'],
  ["namespaced tag", "<a:b c:d=1>t</a:b>"],
  [
    "custom element",
    '<my-el value="1" checked class="c" style="color:red">t</my-el>',
  ],
  ["customized built-in", '<button is="x-b">t</button>'],
  ["MathML", "<math><mi>x</mi></math>"],
  ["NUL characters", "a\u0000b<div \u0000x=1>\u0000</div>"],
  ["entities", "&lt;&amp;&nbsp;&#0;&#x110000;"],
  ["unclosed tags", "<div><p><b>x"],
  ["stray end tags", "</div></p>x</br>"],
  [
    "multiple select",
    "<select multiple><option selected value=a>a</option></select>",
  ],
  [
    "two selected options",
    "<select><option selected>a</option><option selected>b</option></select>",
  ],
  ["file input with value", '<input type="FILE" value="C:\\x">'],
  ["radio input", "<input type=radio checked name=r>"],
  ["template", "<template><b>x</b></template>"],
  ["SVG", '<svg viewBox="0 0 1 1"><use href="#a"/><image href=x /></svg>'],
  ["textarea with value attribute", '<textarea value="v">t</textarea>'],
  [
    "malformed style",
    '<p style=";;:;color:;:red;--:x;background:url(a;b)">x</p>',
  ],
  ["empty URL attributes", "<img src alt><a href>x</a><form action></form>"],
  [
    "full document",
    "<!doctype html><html><head></head><body><p>x</p></body></html>",
  ],
  ["frameset", "<frameset><frame src=x></frameset>"],
  ["text inside table", "<table>x<tr>y<td>z</td></tr></table>"],
  [
    "open dialog and details",
    "<dialog open>x</dialog><details open><summary>s</summary></details>",
  ],
  [
    "media",
    '<video autoplay muted controls src="a.mp4"><track default></video>',
  ],
  ["contenteditable", '<div contenteditable="true">x</div>'],
  [
    "React-only attribute names",
    '<div dangerouslysetinnerhtml="x" suppresshydrationwarning>t</div>',
  ],
  ["only whitespace", " \n\t "],
];

describe.each([
  ["main", main.parse],
  ["core", core.parse],
])("%s parse with hostile input", (_, parse) => {
  it.each(hostileInputs)("handles %s", (_, html) => {
    const onError = jest.fn();
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      expect(() => render(<>{parse(html, { onError })}</>)).not.toThrow();
      expect(onError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });
});

describe("parse with React warnings", () => {
  it.each([
    ["file input with value", '<input type="file" value="x">'],
    ["contenteditable", '<div contenteditable="true">x</div>'],
    ["uppercase submit type", '<input type="SUBMIT" value="Go">'],
  ])("renders %s without a React error", (_, html) => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      render(<>{core.parse(html)}</>);

      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it("keeps the value of an uppercase submit input as its label", () => {
    const { container } = render(
      <>{core.parse('<input type="SUBMIT" value="Go">')}</>
    );

    expect(container.querySelector("input")?.getAttribute("value")).toBe("Go");
  });
});
