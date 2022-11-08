import {
  STYLE_COMMENTS_REGEX,
  STYLE_RULES_REGEX,
  HTML_ATTRIBUTES,
  SVG_ATTRIBUTES,
} from "./constants";
import { camelCase } from "./utils";
import {
  AttributesMap,
  CSSProperties,
  Attributes,
  AtributesPropKeys,
} from "./types";

export const htmlAttrsMap = parseAttrsMap(HTML_ATTRIBUTES);
export const svgAttrsMap = parseAttrsMap(SVG_ATTRIBUTES);

export function parseAttrsMap(attrs: string): AttributesMap {
  return attrs.split(" ").reduce<AttributesMap>(
    (acc, prop) => {
      const value = camelCase(prop) as AtributesPropKeys;

      acc[prop.toLowerCase()] = value;

      if (prop.match(/[-:]/)) {
        acc[value.toLowerCase()] = value;
      }

      return acc;
    },
    {
      class: "className",
      for: "htmlFor",
    }
  );
}

export function styleToObject(style: string): CSSProperties {
  const filteredStyle = style.replace(STYLE_COMMENTS_REGEX, "");
  const rules: Record<string, string | number> = {};
  let arr: RegExpExecArray | null;

  while ((arr = STYLE_RULES_REGEX.exec(filteredStyle))) {
    const key = arr[1];
    const value = arr[2];
    const rule = key[0] == "-" ? key : camelCase(key);

    rules[rule] = Number.isNaN(+value) ? value : +value;
  }

  return rules;
}

export function attrsToProps(
  attrs: NamedNodeMap,
  attrsMap: AttributesMap = {}
): Attributes {
  return Array.from(attrs).reduce<Attributes>((acc, attr) => {
    const nodeName = attr.nodeName;
    const nodeValue = attr.nodeValue || "";
    const attrKey = Object.assign(htmlAttrsMap, attrsMap)[nodeName] || nodeName;

    acc[attrKey] =
      attrKey == "style"
        ? nodeValue
          ? styleToObject(nodeValue)
          : {}
        : nodeValue;

    return acc;
  }, {});
}
