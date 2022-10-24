import {
  createElement,
  cloneElement,
  ReactElement,
  ReactNode,
  ReactHTML,
} from "react";

import { Attributes, attrsToProps } from "./attributes";
import * as p from "./parser";

type NodeType = keyof ReactHTML;
type Components = Record<
  NodeType,
  (props: Attributes, node: Element) => ReactElement
>;
type Options = {
  components?: Partial<Components>;
  config?: p.Config;
};

export function renderElement(
  key: number | string,
  node: Element,
  options: Options
): ReactElement {
  const childNodes = node.childNodes;
  const type = node.nodeName.toLowerCase() as NodeType;
  const props = { key, ...attrsToProps(node.attributes) };
  const children = childNodes.length ? render(childNodes, options) : [];
  const comps = options.components;
  const overrideRenderElement = comps && type in comps && comps[type];

  return overrideRenderElement
    ? cloneElement(overrideRenderElement({ ...props, children }, node))
    : createElement(type, props, children);
}

export function render(nodes: NodeListOf<ChildNode>, options: Options) {
  return Array.from(nodes).reduce<ReactNode[]>((acc, node, key) => {
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
