import React, { useState } from "react";
import { render } from "@testing-library/react";
import { parse } from "../src/core";

function renderHtml(html: string, options = {}) {
  return render(<>{parse(html, options)}</>).container;
}

describe("parse regressions", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    document.head.innerHTML = "";
  });

  it("keeps the case of SVG tag names", () => {
    const container = renderHtml(
      '<svg><linearGradient id="g"></linearGradient><foreignObject></foreignObject></svg>'
    );

    expect(container.querySelector("linearGradient")).not.toBeNull();
    expect(container.querySelector("foreignObject")).not.toBeNull();
  });

  it("keeps leading head-only elements such as <style>", () => {
    const container = renderHtml("<style>.a{color:red}</style><p>x</p>");

    expect(container.querySelector("style")?.textContent).toBe(".a{color:red}");
  });

  it("ignores key, ref and children attributes", () => {
    const container = renderHtml(
      '<p key="a" ref="r">1</p><p key="a" children="evil">2</p>'
    );

    expect(container.innerHTML).toBe("<p>1</p><p>2</p>");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it.each([
    ['<ol><li value="5">x</li></ol>', "li", "5"],
    ['<progress value="50" max="100"></progress>', "progress", "50"],
    ['<button value="v">b</button>', "button", "v"],
    ['<select><option value="a">A</option></select>', "option", "a"],
  ])("keeps the value attribute of %s", (html, selector, value) => {
    const container = renderHtml(html);

    expect(container.querySelector(selector)?.getAttribute("value")).toBe(
      value
    );
  });

  it("keeps the selected option of a select", () => {
    const container = renderHtml(
      '<select><option value="a">A</option><option value="b" selected>B</option></select>'
    );

    expect(container.querySelector("select")?.value).toBe("b");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("keeps every selected option of a multiple select", () => {
    const container = renderHtml(
      '<select multiple><option value="a" selected>A</option><option value="b">B</option><option value="c" selected>C</option></select>'
    );
    const select = container.querySelector("select") as HTMLSelectElement;

    expect(Array.from(select.selectedOptions, (o) => o.value)).toEqual([
      "a",
      "c",
    ]);
  });

  it("ignores a value attribute on a multiple select, as browsers do", () => {
    renderHtml(
      '<select multiple value="b"><option value="a">A</option></select>'
    );

    expect(consoleError).not.toHaveBeenCalled();
  });

  it("renders textarea content as its initial value", () => {
    const container = renderHtml("<textarea>hi</textarea>");

    expect(container.querySelector("textarea")?.value).toBe("hi");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("does not hoist and load an async script", () => {
    renderHtml(
      '<div><script async src="https://example.com/x.js"></script></div>'
    );

    expect(document.head.querySelector("script")).toBeNull();
  });

  it("keeps !important and vendor-prefixed declarations", () => {
    const container = renderHtml(
      '<div style="color: red !important; -webkit-line-clamp: 2; --x-1: 3px">x</div>'
    );
    const style = (container.firstChild as HTMLElement).style;

    expect(style.color).toBe("red");
    expect(style.getPropertyValue("--x-1")).toBe("3px");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("drops whitespace text React rejects inside tables", () => {
    renderHtml("<table>\n<tr><td>1</td></tr>\n</table>");

    expect(consoleError).not.toHaveBeenCalled();
  });

  it("maps attributes added in React 19", () => {
    const container = renderHtml(
      '<img fetchpriority="high"><button popovertarget="p"></button>'
    );

    expect(container.querySelector("img")?.getAttribute("fetchpriority")).toBe(
      "high"
    );
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("renders inert on every supported React version", () => {
    const container = renderHtml("<div inert>x</div>");

    expect(container.querySelector("div")?.hasAttribute("inert")).toBe(true);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("does not touch the page's <html>, <head> or <body>", () => {
    document.documentElement.setAttribute("lang", "en");

    const { unmount } = render(
      <>
        {parse(
          '<svg><html style="display:none"><body class="x"><b>y</b></body></html></svg>'
        )}
      </>
    );

    expect(document.documentElement.getAttribute("lang")).toBe("en");
    expect(document.documentElement.hasAttribute("style")).toBe(false);
    expect(document.body.hasAttribute("class")).toBe(false);
    expect(document.querySelector("b")?.textContent).toBe("y");
    unmount();
    expect(document.documentElement.getAttribute("lang")).toBe("en");
  });

  it("drops leading whitespace before the first node", () => {
    expect(renderHtml("\n  <p>x</p>").innerHTML).toBe("<p>x</p>");
  });

  it("ignores Object.prototype names in attribute lookups", () => {
    const container = renderHtml('<div constructor="a">x</div>');

    expect(container.innerHTML).toBe('<div constructor="a">x</div>');
  });

  it("renders components as components so they can use hooks", () => {
    function Bold(props: React.PropsWithChildren) {
      const [text] = useState("hooked");

      return (
        <strong>
          {text} {props.children}
        </strong>
      );
    }

    const container = renderHtml("<b>x</b>", { components: { b: Bold } });

    expect(container.innerHTML).toBe("<strong>hooked x</strong>");
  });
  it("keeps a custom element's attribute names as written", () => {
    const { container } = render(
      <>{parse('<x-label for="b" class="c" style="color:red">x</x-label>')}</>
    );

    expect(container.innerHTML).toBe(
      '<x-label for="b" class="c" style="color: red;">x</x-label>'
    );
  });

  it("applies attrsMap before the React 18 pass-through", () => {
    const { container } = render(
      <>
        {parse('<div inert="">x</div>', { attrsMap: { inert: "data-inert" } })}
      </>
    );

    expect(container.innerHTML).toBe('<div data-inert="">x</div>');
  });
});
