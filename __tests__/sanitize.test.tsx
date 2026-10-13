import React from "react";
import { render } from "@testing-library/react";
import DOMPurify from "dompurify";
import { parse, renderNodes } from "../src";
import { parse as parseCore } from "../src/core";

function renderHtml(html: string, options = {}) {
  return render(<>{parse(html, options)}</>).container;
}

describe("default sanitizer", () => {
  afterEach(() => {
    document.head.innerHTML = "";
    document.documentElement.removeAttribute("lang");
  });

  it.each(["script", "style", "iframe", "title", "noembed"])(
    "removes <%s> with its content",
    (tag) => {
      const container = renderHtml(`<p>a</p><${tag}>x</${tag}><p>b</p>`);

      expect(container.innerHTML).toBe("<p>a</p><p>b</p>");
      expect(document.head.querySelector(tag)).toBeNull();
    }
  );

  it("removes <object> and keeps only its fallback text", () => {
    const container = renderHtml(
      '<object data="x.swf"><b>fallback</b></object>'
    );

    expect(container.innerHTML).toBe("<b>fallback</b>");
  });

  it.each(["embed", "base", "meta", "link"])("removes <%s>", (tag) => {
    const container = renderHtml(
      `<p>a</p><${tag} href="x" src="x" http-equiv="refresh" content="0;url=https://example.com"><p>b</p>`
    );

    expect(container.innerHTML).toBe("<p>a</p><p>b</p>");
    expect(document.head.querySelector(tag)).toBeNull();
  });

  it("removes SVG animation that can rewrite a link", () => {
    const container = renderHtml(
      '<svg><a><set attributeName="href" to="javascript:alert(1)"></set><animate attributeName="href" values="javascript:alert(1)"></animate>x</a></svg>'
    );

    expect(container.querySelector("set, animate")).toBeNull();
  });

  it("removes event handler attributes", () => {
    const container = renderHtml(
      '<img src="a.png" onerror="alert(1)" ONLOAD="alert(1)">'
    );

    expect(container.innerHTML).toBe('<img src="a.png">');
  });

  it.each([
    '<a href="javascript:alert(1)">x</a>',
    '<a href=" \tjava\nscript:alert(1)">x</a>',
    '<a href="JAVASCRIPT:alert(1)">x</a>',
    '<svg><a xlink:href="javascript:alert(1)">x</a></svg>',
    '<math><mi href="javascript:alert(1)">x</mi></math>',
    '<form action="javascript:alert(1)"></form>',
  ])("removes a javascript: URL from %s", (html) => {
    expect(renderHtml(html).innerHTML).not.toMatch(/javascript/i);
  });

  it("removes id and name values that would clobber document properties", () => {
    const container = renderHtml(
      '<img name="cookie"><p id="body">x</p><p id="intro">y</p>'
    );

    expect(container.innerHTML).toBe('<img><p>x</p><p id="intro">y</p>');
  });

  it("removes form and formaction, which submit the page's own form", () => {
    const container = renderHtml(
      '<button form="checkout" formaction="https://example.com">x</button>'
    );

    expect(container.innerHTML).toBe("<button>x</button>");
  });

  it("keeps attributes that only open the page's own popovers", () => {
    const html = '<button popovertarget="menu">x</button>';

    expect(renderHtml(html).innerHTML).toBe(html);
  });

  it("keeps position: absolute, which stays inside a positioned container", () => {
    const html = '<a style="position: absolute;">x</a>';

    expect(renderHtml(html).innerHTML).toBe(html);
  });

  it("removes a style attribute with position: fixed", () => {
    const container = renderHtml(
      '<a style="position:fixed;inset:0">x</a><b style="position:relative">y</b>'
    );

    expect(container.innerHTML).toBe(
      '<a>x</a><b style="position: relative;">y</b>'
    );
  });

  it.each([
    "}position:fixed;inset:0",
    "a b;position:fixed",
    "position:/**/fixed",
    "position:fixed;position:bogus",
  ])("removes a style attribute with position: fixed hidden as %s", (style) => {
    const container = renderHtml(`<a style="${style}">x</a>`);

    expect(container.innerHTML).toBe("<a>x</a>");
  });

  it("removes elements that would bind to the page's <html> and <body>", () => {
    document.documentElement.setAttribute("lang", "en");

    renderHtml(
      '<svg><html style="display:none"><body class="x"></body></html></svg>'
    );

    expect(document.documentElement.getAttribute("lang")).toBe("en");
    expect(document.documentElement.hasAttribute("style")).toBe(false);
    expect(document.body.hasAttribute("class")).toBe(false);
  });

  it("keeps ordinary markup, styles and SVG", () => {
    const html =
      '<p class="a" style="color: red;">x <a href="/b" title="t">y</a></p><svg viewBox="0 0 1 1"><linearGradient id="g"></linearGradient><path d="M0 0" stroke-width="2"></path></svg>';

    expect(renderHtml(html).innerHTML).toBe(html);
  });

  it("runs a custom mapNode on sanitized nodes only", () => {
    const seen: string[] = [];

    renderHtml('<script>x</script><p onclick="x">y</p>', {
      mapNode: (node: Node) => {
        if (node instanceof Element) {
          seen.push(node.outerHTML);
        }

        return node;
      },
    });

    expect(seen).toEqual(["<p>y</p>"]);
  });

  it("sanitizes children rendered by a mapNode that drops its options", () => {
    const container = renderHtml("<div><iframe></iframe><p>x</p></div>", {
      mapNode: (node: Node) =>
        node instanceof Element && node.localName == "div"
          ? renderNodes(node.childNodes)
          : node,
    });

    expect(container.innerHTML).toBe("<p>x</p>");
  });

  it("keeps tags mapped to components, with their custom attributes", () => {
    const container = renderHtml(
      '<x-card onclick="x" title="t" variant="primary" link=" java\tscript:x">y</x-card>',
      {
        components: {
          "x-card": ({ variant, ...props }: any) => (
            <section data-variant={variant} {...props} />
          ),
        },
      }
    );

    expect(container.innerHTML).toBe(
      '<section data-variant="primary" title="t">y</section>'
    );
  });

  it("does not let a tag through for a component key that never matches", () => {
    expect(
      renderHtml("<iframe></iframe><p>x</p>", {
        components: { IFRAME: () => null },
      }).innerHTML
    ).toBe("<p>x</p>");
  });

  describe("purify config", () => {
    it("is merged over the defaults, its keys replacing them", () => {
      expect(
        renderHtml("<p>a</p><b>b</b><style>p{}</style>", {
          purify: { FORBID_TAGS: ["b"] },
        }).innerHTML
      ).toBe("<p>a</p>b<style>p{}</style>");
    });

    it("can allow extra attributes", () => {
      expect(
        renderHtml('<div contenteditable="true">x</div>', {
          purify: { ADD_ATTR: ["contenteditable"] },
        }).innerHTML
      ).toBe('<div contenteditable="true">x</div>');
    });

    it("keeps component tags when ADD_TAGS is a function", () => {
      expect(
        renderHtml("<x-a>a</x-a><x-b>b</x-b><x-c>c</x-c>", {
          components: { "x-a": ({ children }: any) => <i>{children}</i> },
          purify: { ADD_TAGS: (tagName: string) => tagName == "x-b" },
        }).innerHTML
      ).toBe("<i>a</i><x-b>b</x-b>c");
    });

    it("cannot turn off sanitizing in place or return a different shape", () => {
      expect(
        renderHtml('<p onclick="x">a</p>', {
          purify: { IN_PLACE: false, RETURN_DOM: true, WHOLE_DOCUMENT: true },
        }).innerHTML
      ).toBe("<p>a</p>");
    });

    it("still runs the critical hooks", () => {
      expect(
        renderHtml('<a style="position:fixed">a</a>', {
          purify: { ALLOWED_ATTR: ["style"] },
        }).innerHTML
      ).toBe("<a>a</a>");
    });
  });

  it("keeps link targets and cuts the opener", () => {
    expect(
      renderHtml('<a href="https://x.dev" target="_blank" rel="opener">x</a>')
        .innerHTML
    ).toBe(
      '<a href="https://x.dev" target="_blank" rel="noopener noreferrer">x</a>'
    );
  });

  it("removes unmapped custom elements and keeps their content", () => {
    expect(renderHtml("<x-card>y</x-card>").innerHTML).toBe("y");
  });

  it("still runs after a custom sanitize", () => {
    const sanitize = jest.fn((html: string) =>
      html.replace(/<(\/?)b>/g, "<$1i>")
    );
    const container = renderHtml("<b>x</b><style>p{}</style>", { sanitize });

    expect(sanitize).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).toBe("<i>x</i>");
  });

  it("leaves the app's own DOMPurify untouched", () => {
    renderHtml("<p>x</p>");

    expect(DOMPurify.sanitize('<a style="position:fixed">x</a>')).toBe(
      '<a style="position:fixed">x</a>'
    );
  });

  it("is not applied by the core entry", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { container } = render(
      <>{parseCore('<p onclick="x" id="body">y</p><style>p{}</style>')}</>
    );

    expect(container.querySelector("style")).not.toBeNull();
    expect(container.querySelector("#body")).not.toBeNull();
    consoleError.mockRestore();
  });

  it("can be replaced by DOMPurify through sanitize on the core entry", () => {
    const { container } = render(
      <>
        {parseCore("<script>x</script><p>y</p>", {
          sanitize: DOMPurify.sanitize,
        })}
      </>
    );

    expect(container.innerHTML).toBe("<p>y</p>");
  });
});
