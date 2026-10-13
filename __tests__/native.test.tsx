/**
 * @jest-environment node
 */
import { isValidElement, ReactElement, ReactNode } from "react";
import { Linking } from "react-native";
import { parse } from "../src/native";

jest.mock(
  "react-native",
  () => {
    const host = (name: string) => {
      const component = () => null;

      Object.defineProperty(component, "name", { value: name });

      return component;
    };

    return {
      Text: host("Text"),
      View: host("View"),
      Image: host("Image"),
      Linking: { openURL: jest.fn(() => Promise.resolve()) },
      Platform: {
        select: (specifics: Record<string, unknown>) =>
          "ios" in specifics ? specifics.ios : specifics.default,
      },
    };
  },
  { virtual: true }
);

type Tree =
  | string
  | { type: string; props: Record<string, any>; children: Tree[] };

function flattenStyle(style: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(style)) {
    const merged = Object.assign({}, ...style.map(flattenStyle));

    return Object.keys(merged).length ? merged : undefined;
  }

  return (style as Record<string, unknown>) || undefined;
}

function toTree(node: ReactNode): Tree[] {
  if (node == null || typeof node == "boolean") {
    return [];
  }

  if (typeof node == "string" || typeof node == "number") {
    return [String(node)];
  }

  if (Array.isArray(node)) {
    const keys = node
      .filter(isValidElement)
      .map((element) => (element as ReactElement).key);

    expect(new Set(keys).size).toBe(keys.length);

    return node.flatMap(toTree);
  }

  const element = node as ReactElement<Record<string, any>>;
  const { children, style, ...props } = element.props;
  const type =
    typeof element.type == "string"
      ? element.type
      : (element.type as Function).name || "Fragment";

  if (type == "Fragment" || type == "Symbol(react.fragment)") {
    return toTree(children);
  }

  const flatStyle = flattenStyle(style);

  return [
    {
      type,
      props: flatStyle ? { ...props, style: flatStyle } : props,
      children: toTree(children),
    },
  ];
}

function tree(html: string, options = {}) {
  return toTree(parse(html, options));
}

function text(nodes: Tree[]): string {
  return nodes
    .map((node) => (typeof node == "string" ? node : text(node.children)))
    .join("");
}

function find(nodes: Tree[], type: string): Exclude<Tree, string>[] {
  return nodes.flatMap((node) =>
    typeof node == "string"
      ? []
      : [...(node.type == type ? [node] : []), ...find(node.children, type)]
  );
}

describe("native parse", () => {
  beforeEach(() => {
    (Linking.openURL as jest.Mock).mockClear();
  });

  it("wraps text inside a block in Text, never directly in a View", () => {
    expect(tree("<p>Hello <b>world</b></p>")).toEqual([
      {
        type: "View",
        props: { style: { marginVertical: 8 } },
        children: [
          {
            type: "Text",
            props: {},
            children: [
              "Hello ",
              {
                type: "Text",
                props: { style: { fontWeight: "bold" } },
                children: ["world"],
              },
            ],
          },
        ],
      },
    ]);
  });

  it("wraps top-level text in Text", () => {
    expect(tree("Hello")).toEqual([
      { type: "Text", props: {}, children: ["Hello"] },
    ]);
  });

  it("collapses whitespace and drops whitespace between blocks", () => {
    const nodes = tree("\n  <p>\n  a\n   b  </p>\n  <p>c</p>\n");

    expect(nodes).toHaveLength(2);
    expect(text(nodes)).toBe("a bc");
  });

  it("keeps non-breaking spaces at the edges", () => {
    expect(text(tree("<p>&nbsp;a &amp; b&nbsp;</p>"))).toBe(" a & b ");
  });

  it("keeps whitespace in <pre> with a monospace font", () => {
    const [pre] = tree("<pre>a\n  b</pre>") as any[];

    expect(pre.children[0].props.style).toEqual({ fontFamily: "Menlo" });
    expect(text([pre])).toBe("a\n  b");
  });

  it("keeps <br> at the start and end of a text run", () => {
    expect(text(tree("<p><br>a<br></p>"))).toBe("\na\n");
  });

  it("puts blocks inside inline content on their own lines", () => {
    expect(
      text(
        tree(
          '<a href="https://x.dev">\n  <div>title</div>\n  <div>sub</div>\n</a>'
        )
      )
    ).toBe("title\nsub");
    expect(text(tree("<p>a <span><b>b</b><div>c</div>d</span></p>"))).toBe(
      "a b\nc\nd"
    );
  });

  it("keeps the text styles of a run free of empty entries", () => {
    const runStyles: unknown[][] = [];

    parse("<table><tr><td><div>x</div></td></tr></table>", {
      mapElement: (element: ReactElement<any>) => {
        // Text runs are keyed `<parent key>t<index>`.
        if (/t\d+$/.test(String(element.key))) {
          runStyles.push(element.props.style);
        }

        return element;
      },
    });

    expect(runStyles).toEqual([[]]);
  });

  it("renders <br> as a line break", () => {
    expect(text(tree("<p>a<br>b</p>"))).toBe("a\nb");
  });

  it("gives a text run the text styles of its block ancestors", () => {
    const [run] = find(tree("<h1><span>x</span></h1>"), "Text");

    expect(run.props.style).toEqual({ fontSize: 32, fontWeight: "bold" });
  });

  it("applies textStyle and tagStyles", () => {
    const nodes = tree("<p>a <b>b</b></p>", {
      textStyle: { color: "red" },
      tagStyles: {
        p: { view: { margin: 0 }, text: { fontSize: 20 } },
        b: { text: { color: "blue" } },
      },
    }) as any[];

    expect(nodes[0].props.style).toEqual({ marginVertical: 8, margin: 0 });
    expect(nodes[0].children[0].props.style).toEqual({
      color: "red",
      fontSize: 20,
    });
    expect(nodes[0].children[0].children[1].props.style).toEqual({
      fontWeight: "bold",
      color: "blue",
    });
  });

  it("renders a block inside inline content as Text", () => {
    expect(find(tree("<b><div>x</div></b>"), "View")).toHaveLength(0);
  });

  it("renders the content of unknown elements", () => {
    expect(text(tree("<x-card><constructor>a</constructor></x-card>"))).toBe(
      "a"
    );
  });

  it.each([
    "<script>x</script>",
    "<style>p{}</style>",
    "<iframe src='https://example.com'>x</iframe>",
    "<svg><text>x</text></svg>",
    "<video src='https://example.com/v.mp4'>x</video>",
    "<template><p>x</p></template>",
    "<p hidden>x</p>",
    "<!-- x -->",
  ])("renders nothing for %s", (html) => {
    expect(tree(html)).toEqual([]);
  });

  describe("links", () => {
    it("opens a safe link with Linking", () => {
      const [, link] = find(
        tree('<a href=" https://example.com">x</a>'),
        "Text"
      );

      expect(link.props.accessibilityRole).toBe("link");
      expect(link.props.style).toEqual({
        color: "#0645ad",
        textDecorationLine: "underline",
      });
      link.props.onPress();
      expect(Linking.openURL).toHaveBeenCalledWith("https://example.com");
    });

    it.each([
      "javascript:alert(1)",
      "intent://scan/#Intent;scheme=zxing;end",
      "myapp://pay?amount=100",
      "file:///etc/passwd",
      "/relative",
    ])("does not open %s", (href) => {
      const [, link] = find(tree(`<a href="${href}">x</a>`), "Text");

      expect(link.props.onPress).toBeUndefined();
      expect(link.props.accessibilityRole).toBeUndefined();
    });

    it("hands every href to onLinkPress", () => {
      const onLinkPress = jest.fn();
      const [, link] = find(
        tree('<a href="/docs">x</a>', { onLinkPress }),
        "Text"
      );

      link.props.onPress();
      expect(onLinkPress).toHaveBeenCalledWith("/docs");
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("swallows a rejected openURL", async () => {
      (Linking.openURL as jest.Mock).mockReturnValueOnce(
        Promise.reject(new Error("no app"))
      );
      const [, link] = find(tree('<a href="tel:123">x</a>'), "Text");

      expect(() => link.props.onPress()).not.toThrow();
      await Promise.resolve();
    });
  });

  describe("images", () => {
    it("renders a safe image with its size and alt text", () => {
      expect(
        find(
          tree(
            '<img src="https://x.dev/a.png" width="40" height="30px" alt="A">'
          ),
          "Image"
        )
      ).toEqual([
        {
          type: "Image",
          props: {
            source: { uri: "https://x.dev/a.png" },
            resizeMode: "contain",
            accessible: true,
            accessibilityLabel: "A",
            style: { width: 40, height: 30 },
          },
          children: [],
        },
      ]);
    });

    it("gives an image without a size a full width and a ratio", () => {
      const [image] = find(tree('<img src="https://x.dev/a.png">'), "Image");

      expect(image.props.style).toEqual({ width: "100%", aspectRatio: 16 / 9 });
    });

    it.each([
      "javascript:alert(1)",
      "file:///data/app.db",
      "data:image/svg+xml;base64,PHN2Zz4=",
      "",
    ])("drops an image with src %p", (src) => {
      expect(tree(`<img src="${src}">`)).toEqual([]);
    });

    it("keeps a base64 raster data image", () => {
      expect(
        find(tree('<img src="data:image/png;base64,iVBOR">'), "Image")
      ).toHaveLength(1);
    });
  });

  describe("lists", () => {
    it("renders bullets", () => {
      const nodes = tree("<ul>\n<li>a</li>\n<li>b</li>\n</ul>");

      expect(text(nodes)).toBe("•a•b");
      expect(find(nodes, "View")[1].props.style).toEqual({
        flexDirection: "row",
      });
    });

    it("numbers ordered lists from start, nesting separately", () => {
      expect(
        text(tree('<ol start="3"><li>a<ol><li>x</li></ol></li><li>b</li></ol>'))
      ).toBe("3.a1.x4.b");
    });
  });

  it("starts an ordered list at 0", () => {
    expect(text(tree('<ol start="0"><li>a</li><li>b</li></ol>'))).toBe(
      "0.a1.b"
    );
  });

  it("applies tagStyles.li.text to list item content", () => {
    const [run] = find(
      tree("<ul><li>a</li></ul>", {
        tagStyles: { li: { text: { color: "red" } } },
      }),
      "Text"
    ).slice(1);

    expect(run.props.style).toEqual({ color: "red" });
  });

  it("does not read a percentage image size as pixels", () => {
    const [image] = find(
      tree('<img src="https://x.dev/a.png" width="50%">'),
      "Image"
    );

    expect(image.props.style).toEqual({ width: "100%", aspectRatio: 16 / 9 });
  });

  it("lets a mapped component replace a dropped tag", () => {
    const Player = function Player() {
      return null;
    };

    expect(
      tree("<video>x</video>", { components: { video: Player } })[0]
    ).toMatchObject({ type: "Player" });
  });

  describe("components", () => {
    it("renders a mapped tag with its attributes and rendered children", () => {
      const Card = function Card() {
        return null;
      };
      const [card] = tree(
        '<x-card title="t" style="color:red" ref="r" key="k"><b>x</b></x-card>',
        {
          components: { "x-card": Card },
        }
      ) as any[];

      expect(card.type).toBe("Card");
      expect(card.props).toEqual({ title: "t" });
      expect(text(card.children)).toBe("x");
      expect(card.children[0].type).toBe("Text");
    });

    it("keeps a mapped inline tag inside the text run", () => {
      const Bold = function Bold() {
        return null;
      };
      const nodes = tree("<p>a <b>b</b></p>", {
        components: { b: Bold },
      }) as any[];

      expect(nodes[0].children[0].children[1].type).toBe("Bold");
    });

    it("ignores inherited object keys as component names", () => {
      expect(text(tree("<toString>a</toString>", { components: {} }))).toBe(
        "a"
      );
    });
  });

  it("calls mapElement for every element", () => {
    const mapElement = jest.fn((element) => element);

    tree("<p>a <b>b</b></p>", { mapElement });
    expect(mapElement).toHaveBeenCalledTimes(3);
  });

  it("applies sanitize before parsing", () => {
    expect(text(tree("<p>a</p>", { sanitize: () => "<p>b</p>" }))).toBe("b");
  });

  it.each([undefined, null, 1, {}])("returns null and reports %p", (html) => {
    const onError = jest.fn();

    expect(parse(html as any, { onError })).toBeNull();
    expect(onError).toHaveBeenCalledWith(expect.any(TypeError), html);
  });

  it("reports an error thrown by a component mapper", () => {
    const onError = jest.fn();
    const error = new Error("x");

    expect(
      parse("<p>a</p>", {
        onError,
        mapElement: () => {
          throw error;
        },
      })
    ).toBeNull();
    expect(onError).toHaveBeenCalledWith(error, "<p>a</p>");
  });

  it("survives deep nesting and broken markup", () => {
    expect(text(tree("<div>".repeat(300) + "x" + "<b><i>y</b></i><p>z"))).toBe(
      "xyz"
    );
  });
});
