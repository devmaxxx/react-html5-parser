import { createElement, Fragment, ReactNode } from "react";
import { Image, Linking, StyleProp, Text, TextStyle, View } from "react-native";
import type { parseDocument } from "htmlparser2";
import { own } from "../core/utils";
import {
  BLOCK_STYLES,
  DROPPED_TAGS,
  INLINE_STYLES,
  LINK_STYLE,
  MARKER_STYLE,
  isSafeImage,
  isSafeLink,
} from "./styles";
import { NativeComponentProps, NativeParseOptions } from "./types";

// htmlparser2 is bundled into this entry, so its DOM types are taken from it
// rather than from a domhandler install the consumer may not have.
export type ChildNode = ReturnType<typeof parseDocument>["children"][number];
type Element = Extract<ChildNode, { attribs: unknown }>;

// `breaks`: a block rendered inside inline content, which still needs a line
// of its own.
type Item = { node: ReactNode; inline: boolean; breaks?: boolean };
type List = { ordered: boolean; index: number };
type Context = {
  options: NativeParseOptions;
  inline: boolean;
  pre: boolean;
  // Text styles of the block ancestors. A <Text> inherits only from a parent
  // <Text>, so a text run inside a <View> has to be given them again.
  text: StyleProp<TextStyle>[];
  list?: List;
};

const RESERVED_PROPS = /^(key|ref|children|style)$/;
const DEFAULT_IMAGE_RATIO = 16 / 9;

const HTML_SPACE = /^[\t\n\f\r ]*$/;

// Undefined entries add up with nesting depth, and every Text and View would
// carry them.
function textStyles(...styles: StyleProp<TextStyle>[]) {
  return styles.filter(Boolean);
}

function customStyle(ctx: Context, tagName: string) {
  return own(ctx.options.tagStyles, tagName) || {};
}

function element(
  ctx: Context,
  type: Parameters<typeof createElement>[0],
  props: Record<string, unknown>,
  children?: ReactNode[]
) {
  const node = createElement(type, props, ...(children || []));

  return ctx.options.mapElement ? ctx.options.mapElement(node) : node;
}

function openLink(href: string) {
  // Rejects when no app handles the URL; a tap has nowhere to report that.
  Linking.openURL(href).catch(() => {});
}

function linkPress(ctx: Context, href: string | undefined) {
  const { onLinkPress } = ctx.options;

  if (href === undefined) {
    return undefined;
  }

  if (onLinkPress) {
    return () => onLinkPress(href);
  }

  return isSafeLink(href) ? () => openLink(href.trim()) : undefined;
}

function trimRun(run: ReactNode[]) {
  // Only HTML whitespace: `&nbsp;` is content.
  while (
    typeof run[0] == "string" &&
    !(run[0] = run[0].replace(/^[\t\n\f\r ]+/, ""))
  ) {
    run.shift();
  }

  let last = run.length - 1;

  while (
    typeof run[last] == "string" &&
    !(run[last] = (run[last] as string).replace(/[\t\n\f\r ]+$/, ""))
  ) {
    run.pop();
    last--;
  }
}

function renderInline(nodes: ChildNode[], key: string, ctx: Context) {
  const items = renderItems(nodes, key, { ...ctx, inline: true });
  const result: ReactNode[] = [];

  items.forEach((item, index) => {
    const prev = items[index - 1];
    const next = items[index + 1];

    // Indentation between blocks would otherwise start their lines.
    if (
      typeof item.node == "string" &&
      HTML_SPACE.test(item.node) &&
      ((prev && prev.breaks) || (next && next.breaks))
    ) {
      return;
    }

    if (result.length && (item.breaks || (prev && prev.breaks))) {
      result.push("\n");
    }

    result.push(item.node);
  });

  return result;
}

// React Native throws on a string rendered directly inside a <View>, so runs
// of text and inline elements are wrapped in one <Text> each.
function renderBlock(nodes: ChildNode[], key: string, ctx: Context) {
  const result: ReactNode[] = [];
  let run: ReactNode[] = [];

  const flush = () => {
    if (!ctx.pre) {
      trimRun(run);
    }

    if (run.length) {
      result.push(
        element(
          ctx,
          Text,
          { key: key + "t" + result.length, style: ctx.text },
          run
        )
      );
    }

    run = [];
  };

  for (const item of renderItems(nodes, key, ctx)) {
    if (item.inline) {
      run.push(item.node);
    } else {
      flush();
      result.push(item.node);
    }
  }

  flush();

  return result;
}

function renderItems(nodes: ChildNode[], key: string, ctx: Context): Item[] {
  return nodes.flatMap((node, index) =>
    renderNode(node, key + "." + index, ctx)
  );
}

// Only plain or `px` lengths: a percentage is relative to a layout this
// renderer does not have, and must not be read as that many pixels.
function pixels(value: string | undefined) {
  const match = /^\s*(\d*\.?\d+)(px)?\s*$/.exec(value || "");

  return match ? parseFloat(match[1]) || undefined : undefined;
}

// `start="0"` is valid, so only a missing or non-numeric value defaults to 1.
function listStart(attribs: Element["attribs"]) {
  const start = parseInt(own(attribs, "start") || "", 10);

  return isNaN(start) ? 1 : start;
}

function renderImage(node: Element, key: string, ctx: Context): Item[] {
  const { src = "", alt, width, height } = node.attribs;

  if (!isSafeImage(src)) {
    return [];
  }

  // A remote image without a size renders at 0×0 in React Native.
  const w = pixels(width);
  const h = pixels(height);
  const size =
    w && h
      ? { width: w, height: h }
      : {
          width: w || (h ? undefined : "100%"),
          height: h,
          aspectRatio: DEFAULT_IMAGE_RATIO,
        };

  return [
    {
      node: element(ctx, Image, {
        key,
        source: { uri: src.trim() },
        style: [size, customStyle(ctx, "img").image],
        resizeMode: "contain",
        accessible: !!alt,
        accessibilityLabel: alt,
      }),
      inline: ctx.inline,
    },
  ];
}

function renderListItem(node: Element, key: string, ctx: Context): Item[] {
  const list = ctx.list;
  const marker = list && list.ordered ? ++list.index + "." : "•";
  const style = [BLOCK_STYLES.li.view, customStyle(ctx, "li").view];
  const content = renderBlock(node.children, key, {
    ...ctx,
    list: undefined,
    text: textStyles(...ctx.text, customStyle(ctx, "li").text),
  });

  return [
    {
      node: element(ctx, View, { key, style }, [
        element(ctx, Text, { key: "m", style: [ctx.text, MARKER_STYLE] }, [
          marker,
        ]),
        element(ctx, View, { key: "c", style: { flex: 1 } }, content),
      ]),
      inline: false,
    },
  ];
}

function renderComponent(node: Element, key: string, ctx: Context): Item[] {
  const component = own(ctx.options.components, node.name)!;
  const inline = ctx.inline || !!own(INLINE_STYLES, node.name);
  const props: NativeComponentProps & { key: string } = { key };

  // A `style` attribute holds CSS text, which React Native rejects as a style.
  for (const name in node.attribs) {
    if (!RESERVED_PROPS.test(name)) {
      props[name] = node.attribs[name];
    }
  }

  const children = inline
    ? renderInline(node.children, key, ctx)
    : renderBlock(node.children, key, ctx);

  return [{ node: element(ctx, component, props, children), inline }];
}

function renderNode(node: ChildNode, key: string, ctx: Context): Item[] {
  if (node.type == "text") {
    const text = ctx.pre ? node.data : node.data.replace(/[\t\n\f\r ]+/g, " ");

    return text ? [{ node: text, inline: true }] : [];
  }

  // Script and style elements have their own node types, and are dropped.
  if (node.type != "tag") {
    return [];
  }

  const { name, attribs } = node;

  if (own(attribs, "hidden") !== undefined) {
    return [];
  }

  // A mapped component is an explicit opt-in, so it wins over the tags that
  // are otherwise dropped.
  if (own(ctx.options.components, name)) {
    return renderComponent(node, key, ctx);
  }

  if (DROPPED_TAGS.test(name)) {
    return [];
  }

  // A fragment rather than a string, so trimming a text run keeps it.
  if (name == "br") {
    return [{ node: createElement(Fragment, { key }, "\n"), inline: true }];
  }

  if (name == "img") {
    return renderImage(node, key, ctx);
  }

  const custom = customStyle(ctx, name);
  const inlineStyle = own(INLINE_STYLES, name);

  if (inlineStyle) {
    const onPress =
      name == "a" ? linkPress(ctx, own(attribs, "href")) : undefined;
    const props = onPress
      ? {
          key,
          style: [inlineStyle, LINK_STYLE, custom.text],
          onPress,
          accessibilityRole: "link",
        }
      : { key, style: [inlineStyle, custom.text] };

    return [
      {
        node: element(ctx, Text, props, renderInline(node.children, key, ctx)),
        inline: true,
      },
    ];
  }

  if (name == "li" && !ctx.inline) {
    return renderListItem(node, key, ctx);
  }

  const block = own(BLOCK_STYLES, name);

  // An unknown element renders only its content, as browsers do.
  if (!block) {
    return renderItems(node.children, key, ctx);
  }

  const pre = ctx.pre || name == "pre";

  // A <View> inside a <Text> breaks text layout, so a block nested in inline
  // content becomes text too.
  if (ctx.inline) {
    return [
      {
        node: element(
          ctx,
          Text,
          { key, style: [block.text, custom.text] },
          renderInline(node.children, key, { ...ctx, pre })
        ),
        inline: true,
        breaks: true,
      },
    ];
  }

  const list =
    name == "ul" || name == "ol"
      ? { ordered: name == "ol", index: listStart(attribs) - 1 }
      : ctx.list;

  return [
    {
      node: element(
        ctx,
        View,
        { key, style: [block.view, custom.view] },
        renderBlock(node.children, key, {
          ...ctx,
          pre,
          list,
          text: textStyles(...ctx.text, block.text, custom.text),
        })
      ),
      inline: false,
    },
  ];
}

export function renderHtml(nodes: ChildNode[], options: NativeParseOptions) {
  return renderBlock(nodes, "", {
    options,
    inline: false,
    pre: false,
    text: textStyles(options.textStyle),
  });
}
