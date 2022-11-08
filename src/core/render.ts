import { ReactNode, createElement, cloneElement, isValidElement } from "react";
import { identity } from "./utils";
import { attrsToProps } from "./attributes";
import { RenderOptions } from "./types";

export function renderNode(
  node: Node,
  key: number,
  options: RenderOptions
): ReactNode {
  const { mapNode, mapElement, components } = options;
  const _mapNode = mapNode || identity;
  const _node = _mapNode(node, key, options);

  if (!(_node && _node instanceof Node)) {
    return _node;
  }

  const nodeType = _node.nodeType;

  if (nodeType === 3) {
    return _node.nodeValue;
  }

  if (nodeType === 1) {
    const { childNodes, nodeName, attributes } = _node as Element;
    const _nodeName = nodeName.toLowerCase();
    const children = childNodes.length
      ? renderNodes(childNodes, options)
      : undefined;
    const props = Object.assign({ key, children }, attrsToProps(attributes));
    const mapComponent = components?.[_nodeName];

    const element = mapComponent
      ? mapComponent(props)
      : createElement(_nodeName, props);

    return mapElement && isValidElement(element)
      ? mapElement(element)
      : element;
  }
}

export function renderNodes(
  nodeList: NodeListOf<Node>,
  options: RenderOptions
): ReactNode[] {
  return Array.from(nodeList).reduce<ReactNode[]>(
    (acc, node, key) => (acc.push(renderNode(node, key, options)), acc),
    []
  );
}
