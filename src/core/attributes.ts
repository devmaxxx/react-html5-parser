import {
  STYLE_COMMENTS_REGEX,
  STYLE_RULES_REGEX,
  HTML_ATTRIBUTES,
  BOOL_HTML_ATTRIBUTES,
} from "./constants";
import { camelCase, boolAttrValue, identity } from "./utils";
import {
  AttributesMap,
  CSSProperties,
  Props,
  Attribute,
  RenderOptions,
} from "./types";

export const parseAttrs = (
  attrs: string,
  initialValue?: AttributesMap
): AttributesMap =>
  attrs.split(" ").reduce<AttributesMap>((acc, prop) => {
    const value = camelCase(prop);

    acc[prop.toLowerCase()] = value;

    if (prop.match(/[-:]/)) acc[value.toLowerCase()] = value;

    return acc;
  }, initialValue || {});

export const styleToObject = (
  style: string,
  rules: Record<string, string | number> = {},
  arr?: RegExpExecArray | null,
  key?: string
): CSSProperties => {
  style = style.replace(STYLE_COMMENTS_REGEX, "");

  while ((arr = STYLE_RULES_REGEX.exec(style))) {
    key = arr[1];
    rules[key[0] === "-" ? key : camelCase(key)] = arr[2];
  }

  return rules;
};

export const attrsToProps = (
  attributes: Attribute[],
  options: Pick<RenderOptions, "attrsMap" | "mapAttr">
): Props =>
  attributes.reduce<Props>((acc, attr, _, arr) => {
    const { name, value } = attr;
    const propKey =
      ["checked", "value"].includes(name) &&
      !arr.some(
        (el) => el.name === "type" && ["reset", "submit"].includes(el.value)
      )
        ? camelCase("default-" + name)
        : options.attrsMap[name] || name;
    const propValue =
      propKey === "style"
        ? value
          ? styleToObject(value)
          : {}
        : boolHtmlAttrsMap[name]
        ? boolAttrValue(value, name)
        : value;

    const prop = (options.mapAttr || identity)([propKey, propValue], attr);

    if (prop) acc[prop[0]] = prop[1];

    return acc;
  }, {});

export const boolHtmlAttrsMap = parseAttrs(BOOL_HTML_ATTRIBUTES);
export const htmlAttrsMap = parseAttrs(
  HTML_ATTRIBUTES,
  Object.assign(
    {
      class: "className",
      for: "htmlFor",
    },
    boolHtmlAttrsMap
  )
);
