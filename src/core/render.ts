import { createElement, ReactElement, ReactNode, Fragment } from "react";
import { attrsToProps } from "./attributes";
import { Options, NodeType } from "./types";

export function renderElement(
  key: number | string,
  node: Element,
  options: Options,
  undef?: undefined
): ReactElement {
  const childNodes = node.childNodes;
  const type = node.tagName.toLowerCase() as NodeType;
  const props = Object.assign({ key }, attrsToProps(node.attributes));
  const children = childNodes.length ? renderNodes(childNodes, options) : undef;
  const components = options.components || {};

  return createElement(components[type] || type, props, children);
}

export function renderNodes(nodeList: NodeListOf<ChildNode>, options: Options) {
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

export function render(doc: DocumentFragment, options: Options): ReactElement {
  return createElement(Fragment, {}, renderNodes(doc.childNodes, options));
}
