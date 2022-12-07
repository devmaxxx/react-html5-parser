import { ParserNode, ParserElement, PropArr, Attribute } from "./types";

export const camelCase = (value: string) =>
  value.replace(/[-:](\w)/g, (_, $1) => $1.toUpperCase());

export const identity = <T>(value: T) => value;

export const boolAttrValue = (value: unknown, nodeName?: string) =>
  !value || (nodeName === "download" ? value : !!value);

export const isString = (value: unknown): value is string =>
  typeof value === "string";

export const isNode = (value: unknown): value is ParserNode =>
  !!value && typeof value === "object" && "nodeType" in value;

export const getChildNodes = (childNodes: ParserElement["childNodes"]) =>
  (childNodes.length && Array.from(childNodes)) || null;

export const arrToObj = (arr?: string[]) =>
  (arr || []).reduce<Record<string, boolean>>(
    (acc, v) => ((acc[v] = !0), acc),
    {}
  );

export const checkNode = (
  obj: Record<string, boolean>,
  node: ParserNode,
  fallback: boolean
): boolean | undefined =>
  isNode(node) && node.nodeType === 1
    ? obj[(node as ParserElement).tagName.toLowerCase()]
    : fallback;

export const getPropName = (
  obj: Record<string, boolean>,
  propArr: PropArr,
  attr: Attribute
) => obj[propArr[0]] || obj[attr.name];

export const allowOnlyTags =
  (tags: string[], obj = arrToObj(tags)) =>
  (node: ParserNode) =>
    !checkNode(obj, node, !0)
      ? getChildNodes((node as ParserElement).childNodes)
      : node;

export const forbidTags =
  (tags: string[], obj = arrToObj(tags)) =>
  (node: ParserNode) =>
    checkNode(obj, node, !1)
      ? getChildNodes((node as ParserElement).childNodes)
      : node;

export const allowOnlyAttrs =
  (attrs: string[], obj = arrToObj(attrs)) =>
  (propArr: PropArr, attr: Attribute) =>
    !getPropName(obj, propArr, attr) ? null : propArr;

export const forbidAttrs =
  (attrs: string[], obj = arrToObj(attrs)) =>
  (propArr: PropArr, attr: Attribute) =>
    getPropName(obj, propArr, attr) ? null : propArr;
