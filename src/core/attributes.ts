import {
  STYLE_COMMENTS_REGEX,
  STYLE_RULES_REGEX,
  HTML_ATTRIBUTES,
  BOOL_HTML_ATTRIBUTES,
} from "./constants";
import { camelCase, boolAttrValue } from "./utils";
import { AttributesMap, CSSProperties, Props, Attribute } from "./types";

export const htmlAttrsMap = parseAttrs(HTML_ATTRIBUTES, {
  class: "className",
  for: "htmlFor",
});
export const boolHtmlAttrsMap = parseAttrs(BOOL_HTML_ATTRIBUTES);

export function parseAttrs(
  attrs: string,
  initialValue?: AttributesMap
): AttributesMap {
  return attrs.split(" ").reduce<AttributesMap>((acc, prop) => {
    const value = camelCase(prop);

    acc[prop.toLowerCase()] = value;

    if (prop.match(/[-:]/)) {
      acc[value.toLowerCase()] = value;
    }

    return acc;
  }, initialValue || {});
}

export function styleToObject(style: string): CSSProperties {
  style = style.replace(STYLE_COMMENTS_REGEX, "");
  const rules: Record<string, string | number> = {};
  let arr: RegExpExecArray | null;

  while ((arr = STYLE_RULES_REGEX.exec(style))) {
    const key = arr[1];
    const value = arr[2];
    const rule = key[0] == "-" ? key : camelCase(key);

    rules[rule] = value;
  }

  return rules;
}

export function attrsToProps(
  attributes: Attribute[],
  attrsMap: AttributesMap
): Props {
  return attributes.reduce<Props>((acc, { name, value }, _, arr) => {
    const defaultValue = value || "";
    const key =
      ["checked", "value"].includes(name) &&
      !arr.some(
        (el) =>
          el.name === "type" && ["reset", "submit"].includes(el.value || "")
      )
        ? camelCase("default-" + name)
        : attrsMap[name] || name;

    acc[key] =
      key == "style"
        ? defaultValue
          ? styleToObject(defaultValue)
          : {}
        : boolHtmlAttrsMap[name]
        ? boolAttrValue(value, name)
        : defaultValue;

    return acc;
  }, {});
}
