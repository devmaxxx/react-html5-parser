import {
  STYLE_COMMENTS_REGEX,
  STYLE_RULES_REGEX,
  HTML_ATTRIBUTES,
  BOOL_HTML_ATTRIBUTES,
} from "./constants";
import { camelCase, boolAttrValue } from "./utils";
import {
  AttributesMap,
  CSSProperties,
  Attributes,
  AtributesPropKeys,
} from "./types";

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
    const value = camelCase(prop) as AtributesPropKeys;

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
  node: Element,
  attrsMap: AttributesMap
): Attributes {
  return Array.from(node.attributes).reduce<Attributes>(
    (acc, { nodeName, nodeValue }) => {
      const defaultAttrValue = nodeValue || "";
      const attrKey =
        !["reset", "submit"].includes(node.getAttribute("type") || "") &&
        ["checked", "value"].includes(nodeName)
          ? camelCase("default-" + nodeName)
          : attrsMap[nodeName] || nodeName;

      acc[attrKey] =
        attrKey == "style"
          ? defaultAttrValue
            ? styleToObject(defaultAttrValue)
            : {}
          : boolHtmlAttrsMap[nodeName]
          ? boolAttrValue(nodeValue, nodeName)
          : defaultAttrValue;

      return acc;
    },
    {}
  );
}
