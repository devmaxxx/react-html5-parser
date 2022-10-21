import { createElement, ReactElement, ReactNode } from "react";
import * as p from "./parser";

type Options = {
  components?: Record<string, () => ReactElement>;
  config?: p.Config;
};

function getAttrKey(nodeName: string) {
  return nodeName;
}

function getAttrValue(attrKey: string, nodeValue: string | null): string {
  return nodeValue || "";
}

// HTMLElementTagNameMap
// AllHTMLAttributes

function attrsToProps(attrs: NamedNodeMap, attrKey?: string) {
  return Array.from(attrs).reduce<Record<string, string>>(
    (acc, attr) => (
      ((attrKey = getAttrKey(attr.nodeName)),
      (acc[attrKey] = getAttrValue(attrKey, attr.nodeValue))),
      acc
    ),
    {}
  );
}

function getElement(
  node: Element,
  components: Options["components"]
): ReactElement {
  const { attributes, childNodes, nodeName } = node;
  const type = nodeName.toLowerCase();
  const props = attrsToProps(attributes);

  return createElement(
    type,
    props,
    childNodes.length ? render(childNodes, components) : []
  );
}

function render(
  nodes: NodeListOf<ChildNode>,
  components: Options["components"]
) {
  return Array.from(nodes).reduce<ReactNode[]>((acc, node) => {
    const isTextNode = node.nodeType === Node.TEXT_NODE;

    if (isTextNode || node.nodeType === Node.ELEMENT_NODE) {
      acc.push(
        isTextNode ? node.nodeValue : getElement(node as Element, components)
      );
    }

    return acc;
  }, []);
}

export default function parse(html: p.Html, options: Options = {}) {
  if (typeof html !== "string") return [];

  const doc = p.parse(html, options.config || {});

  return render(doc.childNodes, options.components);
}
