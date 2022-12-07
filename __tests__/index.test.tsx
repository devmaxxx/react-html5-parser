import React from "react";
import { render } from "@testing-library/react";
import { parseDocument, DomUtils } from "htmlparser2";
import { parse } from "../src";

describe("parse", () => {
  it("should be defined and function", () => {
    expect(parse).toBeDefined();
    expect(typeof parse).toBe("function");
  });

  it("should parse html with htmlparser2", () => {
    const onError = jest.fn();

    const html1 =
      '<div class="container" data-vce-boxed-width="true">Hello</div> world';

    const html2 = `<!DOCTYPE html>
      <html lang="en-US">
        <head>
          <meta charset="UTF-8" />
          <title>title</title>
        </head>
        <body>
          ${html1}
        </body>
      </html>`;

    const parser = (str: string) => {
      const doc = parseDocument(str);
      const body = DomUtils.findOne((el) => el.name === "body", doc.childNodes);

      return (body || doc).childNodes;
    };

    const node1 = parse(html1, { parser, onError });
    const node2 = parse(html2, { parser, onError });

    [node1, node2].map((node) => {
      const { container } = render(<>{node}</>);

      expect(onError).not.toBeCalled();
      expect(container).toBeVisible();
      expect(container.innerHTML.trim()).toMatchInlineSnapshot(
        `"<div class="container" data-vce-boxed-width="true">Hello</div> world"`
      );
    });
  });

  it("should parse html", () => {
    const node = parse(
      '<div class="vce-row-container" data-vce-boxed-width="true"><div class="vce-row vce-row--col-gap-30 vce-row-equal-height vce-row-content--top" id="el-9a9a0daa" data-vce-do-apply="all el-9a9a0daa"><div class="vce-row-content" data-vce-element-content="true"><div class="vce-col vce-col--md-auto vce-col--xs-1 vce-col--xs-last vce-col--xs-first vce-col--sm-last vce-col--sm-first vce-col--md-last vce-col--lg-last vce-col--xl-last vce-col--md-first vce-col--lg-first vce-col--xl-first" id="el-8c088b93"><div class="vce-col-inner" data-vce-do-apply="border margin background  el-8c088b93"><div class="vce-col-content" data-vce-element-content="true" data-vce-do-apply="padding el-8c088b93"><div></div></div></div></div></div></div></div><div class="vce-row-container" data-vce-boxed-width="true"><div class="vce-row vce-row--col-gap-30 vce-row-equal-height vce-row-content--top" id="el-f6493b28" data-vce-do-apply="all el-f6493b28"><div class="vce-row-content" data-vce-element-content="true"><div class="vce-col vce-col--md-auto vce-col--xs-1 vce-col--xs-last vce-col--xs-first vce-col--sm-last vce-col--sm-first vce-col--md-last vce-col--lg-last vce-col--xl-last vce-col--md-first vce-col--lg-first vce-col--xl-first" id="el-b5776850"><div class="vce-col-inner" data-vce-do-apply="border margin background  el-b5776850"><div class="vce-col-content" data-vce-element-content="true" data-vce-do-apply="padding el-b5776850"><section class="vce-hero-section-container vce-hero-section-media--xs vce-hero-section-media--sm vce-hero-section-media--md vce-hero-section-media--lg"><div class="vce vce-hero-section" id="el-f2cf62c4" data-vce-do-apply="margin background border  el-f2cf62c4"><div class="vce-hero-section--wrap-row vce-hero-section--background-position-center-center" style="background-image: url(\'\'); /* color: white; */ "><div class="vce-hero-section--wrap"><div class="vce-hero-section--content" data-vce-do-apply="padding el-f2cf62c4"><div class="vce-hero-section--content-container"><h1 style="color: #fff;">Highland Traditions of Scotland</h1>\n<p style="color: #fff;">The region became culturally distinguishable from the Lowlands from the later Middle Ages into the modern period.</p></div><div class="vce-button--style-basic-container vce-button--style-basic-container--align-center"><span class="vce-button--style-basic-wrapper vce" id="el-08abb633" data-vce-do-apply="margin el-08abb633"><button class="vce-button vce-button--style-basic vce-button--style-basic--border-square vce-button--style-basic--size-medium vce-button--style-basic--color-557cbf--fff" data-vce-do-apply="padding border background  el-08abb633">Apply Now</button></span></div></div></div></div></div></section></div></div></div></div></div></div><div class="vce-row-container" data-vce-boxed-width="true"><div class="vce-row vce-row--col-gap-30 vce-row-equal-height vce-row-content--top" id="el-26c9385c" data-vce-do-apply="all el-26c9385c"><div class="vce-row-content" data-vce-element-content="true"><div class="vce-col vce-col--md-auto vce-col--xs-1 vce-col--xs-last vce-col--xs-first vce-col--sm-last vce-col--sm-first vce-col--md-last vce-col--lg-last vce-col--xl-last vce-col--md-first vce-col--lg-first vce-col--xl-first" id="el-c45b6ad5"><div class="vce-col-inner" data-vce-do-apply="border margin background  el-c45b6ad5"><div class="vce-col-content" data-vce-element-content="true" data-vce-do-apply="padding el-c45b6ad5"><div class="vce-simple-image-slider" style="--backgroundPosition:center center; --pointerColor:#fff; --pointerColorHover:#fd9a00;"><div class="vce-simple-image-slider-wrapper vce" id="el-82299bdd" data-vce-do-apply="all el-82299bdd"><div class="vce-simple-image-slider-helper vce-simple-image-slider-aspect-ratio--3-4"><div class="vce-simple-image-slider-list" data-slick-autoplay="on" data-slick-autoplay-delay="5000" data-slick-effect="slideIn" data-slick-dots="on" data-slick-arrows="off"><div class="slick-list"><div class="slick-track"><div class="vce-simple-image-slider-item vc-slick-item"><div style="background-image:url(https://images.ctfassets.net/hrltx12pl8hq/7JnR6tVVwDyUM8Cbci3GtJ/bf74366cff2ba271471725d0b0ef418c/shutterstock_376532611-og.jpg)" class="vce-simple-image-slider-img vce-simple-image-slider-img--scale"><img class="" src="https://cdn.pixabay.com/photo/2018/08/14/13/23/ocean-3605547__340.jpg" style="opacity:0" alt=""></div></div></div></div></div><div class="vce-simple-image-slider-dots"></div></div></div></div></div></div></div></div></div></div>'
    );

    const { container } = render(<>{node}</>);

    expect(container).toBeVisible();
  });

  it("should parse html temeplate", () => {
    global.DOMParser = jest.fn().mockImplementationOnce(() => {});

    const node = parse(
      `<!DOCTYPE html>
      <html lang="en-US">
        <head>
          <meta charset="UTF-8" />
          <title>title</title>
        </head>
        <body>
          <div>Hello</div>
        </body>
      </html>`,
      {
        mapNode: (n) => {
          const node = n as Node;

          if (node.nodeType === node.ELEMENT_NODE && node.nodeName === "DIV") {
            return Array.from(node.childNodes);
          }

          return node;
        },
      }
    );

    const { container } = render(<>{node}</>);

    expect(container).toBeVisible();
    expect(container.innerHTML.trim()).toMatchInlineSnapshot(`"Hello"`);
  });

  it("should return empty fragment for empty string", () => {
    const node = parse("");

    expect(node).toStrictEqual(<>{[]}</>);

    const { container } = render(<>{node}</>);

    expect(container).toBeVisible();
  });

  it("should return empty fragment and invoke onError if we got not a string", () => {
    const onError = jest.fn();

    //@ts-ignore
    const node = parse(null, { onError });

    expect(onError).toBeCalled();
    expect(onError).toBeCalledWith(new TypeError("HTML must be a string"), {
      html: null,
    });
    expect(node).toStrictEqual(null);
  });

  it("should return empty fragment and invoke onError if we got not a string after sanitize", () => {
    const onError = jest.fn(() => {});
    const sanitize = jest.fn((_: string) => null);
    //@ts-ignore
    const node = parse("<div></div>", { onError, sanitize });

    expect(onError).toBeCalled();
    expect(onError).toBeCalledWith(
      new TypeError("Sanitized HTML must be a string"),
      {
        html: null,
      }
    );
    expect(node).toStrictEqual(null);
  });

  it("should parse components", () => {
    global.DOMParser = jest.fn().mockImplementationOnce(() => {});

    function C(props: any) {
      return <b {...props} />;
    }

    const node = parse(
      `Hello,<c>!</c><div class='active' style='color: red; font-size-adjust: initial; font-weight: 600' id>, world<span style>!</span><b></b></div><input type='text' value="Submit">`,
      {
        components: {
          span: (props) => <b {...props} />,
          c: C,
        },
        mapElement: (element) => {
          return element;
        },
        attrsMap: {
          hello: "world",
        },
        onError: () => {},
      }
    );

    const { getByText, container } = render(<>{node}</>);

    expect(container.innerHTML).toMatchInlineSnapshot(
      `"Hello,<b>!</b><div class="active" style="color: red; font-size-adjust: initial; font-weight: 600;" id="">, world<b>!</b><b></b></div><input type="text" value="Submit">"`
    );
    const element = getByText(/world/i);

    expect(element).toBeInTheDocument();
    expect(element.className).toBe("active");
  });
});
