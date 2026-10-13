import { version } from "react";
import {
  STYLE_COMMENTS_REGEX,
  STYLE_RULES_REGEX,
  HTML_ATTRIBUTES,
  BOOL_HTML_ATTRIBUTES,
  SVG_ATTRIBUTES,
} from "./constants";
import { camelCase, boolAttrValue, own } from "./utils";
import { AttributesMap, CSSProperties, Attributes } from "./types";

export const htmlAttrsMap = parseAttrs(HTML_ATTRIBUTES, {
  class: "className",
  for: "htmlFor",
});
export const boolHtmlAttrsMap = parseAttrs(BOOL_HTML_ATTRIBUTES);
export const svgAttrsMap = parseAttrs(SVG_ATTRIBUTES);

// One lookup per attribute instead of three; earlier maps lose on a clash.
const knownAttrsMap: AttributesMap = Object.assign(
  {},
  boolHtmlAttrsMap,
  svgAttrsMap,
  htmlAttrsMap
);

// React 18 does not know these props: it warns on the camelCase names and
// drops `inert={true}`. The raw attribute works on every version.
const REACT_19_ATTRS =
  /^(fetchpriority|popovertarget|popovertargetaction|inert|credentialless)$/;
const isReact18 = parseInt(version) < 19;

// React reads these as instructions, not DOM attributes: `ref="x"` crashes
// the render and `children="x"` replaces the real child nodes.
const RESERVED_PROPS = ["key", "ref", "children"];

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

function styleKey(prop: string) {
  if (prop.startsWith("--")) {
    return prop;
  }

  const lowerProp = prop.toLowerCase();

  // React expects `msTransition`, but `WebkitTransition` / `MozTransition`.
  return camelCase(
    lowerProp.startsWith("-ms-") ? lowerProp.slice(1) : lowerProp
  );
}

export function styleToObject(style: string): CSSProperties {
  const rules: Record<string, string> = {};

  // A style object cannot carry priority, and React drops a value that still
  // holds `!important`, so the declaration would vanish entirely.
  style
    .replace(STYLE_COMMENTS_REGEX, "")
    .replace(STYLE_RULES_REGEX, (_, prop: string, value: string) => {
      rules[styleKey(prop)] = value.replace(/\s*!important\s*$/i, "").trim();

      return "";
    });

  return rules;
}

function inputType(node: Element) {
  return (node.getAttribute("type") || "").toLowerCase();
}

function isUncontrolledField(node: Element) {
  const tagName = node.localName;

  if (tagName == "input") {
    return !["reset", "submit"].includes(inputType(node));
  }

  return tagName == "textarea" || tagName == "select";
}

function isDroppedAttr(node: Element, name: string) {
  const tagName = node.localName;

  return (
    RESERVED_PROPS.includes(name) ||
    // `<select>` carries the selection as `defaultValue` instead.
    (tagName == "option" && name == "selected") ||
    // React 19 hoists `<script async>` into <head> and runs it; without
    // `async` it renders an inert script, as React 18 did.
    (tagName == "script" && name == "async") ||
    // React throws while rendering a file input with a non-empty value.
    (tagName == "input" && name == "value" && inputType(node) == "file") ||
    // Browsers ignore `value` here; as `defaultValue` on a multiple select it
    // is a string where React requires an array.
    ((tagName == "select" || tagName == "textarea") && name == "value")
  );
}

function selectDefaultValue(select: HTMLSelectElement) {
  const values = Array.from(select.querySelectorAll("option"))
    .filter((option) => option.hasAttribute("selected"))
    .map((option) => option.value);

  if (!values.length) {
    return undefined;
  }

  // Without `multiple` the browser keeps the last selected option.
  return select.hasAttribute("multiple") ? values : values[values.length - 1];
}

export function attrsToProps(
  node: Element,
  attrsMap: AttributesMap = {}
): Attributes {
  const uncontrolled = isUncontrolledField(node);
  // React passes a custom element's props through as attributes, so HTML
  // renames such as `for` → `htmlFor` would reach the DOM as `htmlfor`.
  const isCustomElement = node.localName.includes("-");
  const props = Array.from(node.attributes).reduce<Attributes>(
    (acc, { nodeName, nodeValue }) => {
      if (isDroppedAttr(node, nodeName)) {
        return acc;
      }

      const value = nodeValue || "";
      const mappedName = own(attrsMap, nodeName);

      if (
        !mappedName &&
        (isCustomElement || (isReact18 && REACT_19_ATTRS.test(nodeName)))
      ) {
        // React 18 writes `className` on a custom element as `classname`.
        acc[nodeName == "class" && !isReact18 ? "className" : nodeName] =
          nodeName == "style" ? styleToObject(value) : value;

        return acc;
      }

      // A name the caller maps elsewhere keeps the value as written.
      const boolName = own(boolHtmlAttrsMap, nodeName);
      const isBool = !!boolName && (!mappedName || mappedName == boolName);
      const propName =
        uncontrolled && (nodeName == "checked" || nodeName == "value")
          ? camelCase("default-" + nodeName)
          : mappedName || own(knownAttrsMap, nodeName) || nodeName;

      if (propName == "style") {
        acc.style = styleToObject(value);
      } else if (isBool) {
        acc[propName] = boolAttrValue(value, nodeName);
      } else {
        // HTML input types are case-insensitive; React's checks are not.
        acc[propName] =
          nodeName == "type" && node.localName == "input"
            ? value.toLowerCase()
            : value;
      }

      return acc;
    },
    {}
  );

  if (node.localName == "select") {
    const defaultValue = selectDefaultValue(node as HTMLSelectElement);

    if (defaultValue !== undefined) {
      props.defaultValue = defaultValue;
    }
  }

  if (node.localName == "textarea") {
    props.defaultValue = node.textContent || "";
  }

  // The children come from the HTML, so React's warning about managing the
  // content of an editable element does not apply.
  if ("contentEditable" in props) {
    props.suppressContentEditableWarning = true;
  }

  return props;
}
