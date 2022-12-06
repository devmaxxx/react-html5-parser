import { ParserNode, ParserElement, PropArr, Attribute } from "./types";

export const camelCase = (value: string) =>
  value.replace(/[-:](\w)/g, (_, $1) => $1.toUpperCase());

export const identity = <T>(value: T): T => value;

export const boolAttrValue = (value: unknown, nodeName?: string) =>
  !value || (nodeName === "download" ? value : !!value);

export const isString = (value: unknown): value is string =>
  typeof value === "string";

export const isNode = (value: unknown): value is ParserNode =>
  !!value && typeof value === "object" && "nodeType" in value;

const isElement = (node: ParserNode): node is ParserElement =>
  isNode(node) && node.nodeType === 1;

export const arrToObj = (arr: string[]) =>
  arr.reduce<Record<string, boolean>>((acc, v) => ((acc[v] = !0), acc), {});

export const getTagName = (elem: ParserElement) => elem.tagName.toLowerCase();

export const allowOnlyTags = (tags: string[] = []) => {
  const objTags = arrToObj(tags);

  return (node: ParserNode) =>
    isElement(node) ? (objTags[getTagName(node)] ? node : null) : node;
};

export const forbidTags = (attrs: string[] = []) => {
  const objTags = arrToObj(attrs);

  return (node: ParserNode) =>
    isElement(node) ? (objTags[getTagName(node)] ? null : node) : node;
};

export const allowOnlyAttrs = (attrs: string[] = []) => {
  const objAttrs = arrToObj(attrs);

  return (propArr: PropArr, attr: Attribute) =>
    objAttrs[propArr[0]] || objAttrs[attr.name] ? propArr : null;
};

export const forbidAttrs = (attrs: string[] = []) => {
  const objAttrs = arrToObj(attrs);

  return (propArr: PropArr, attr: Attribute) =>
    objAttrs[propArr[0]] || objAttrs[attr.name] ? null : propArr;
};
