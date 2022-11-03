import { createElement, ReactElement, ReactNode } from "react";
import { attrsToProps } from "./attributes";
import { RenderOptions, NodeType } from "./types";

export function renderElement(
  key: number | string,
  node: Element,
  options: RenderOptions,
  undef?: undefined
): ReactElement {
  const childNodes = node.childNodes;
  const type = node.tagName.toLowerCase() as NodeType;
  const props = Object.assign({ key }, attrsToProps(node.attributes));
  const children = childNodes.length ? renderNodes(childNodes, options) : undef;
  const components = options.components || {};

  return createElement(components[type] || type, props, children);
}

export function renderNodes(
  nodeList: NodeListOf<ChildNode>,
  options: RenderOptions
) {
  return Array.from(nodeList).reduce<ReactNode[]>((acc, node, key) => {
    const nodeType = node.nodeType;
    const isTextNode = nodeType === Node.TEXT_NODE;

    if (isTextNode || nodeType === Node.ELEMENT_NODE) {
      acc.push(
        isTextNode
          ? node.nodeValue
          : renderElement(key, node as Element, options)
      );
    }

    return acc;
  }, []);
}
