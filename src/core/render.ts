import { ReactNode, createElement, isValidElement } from "react";
import { identity } from "./utils";
import { attrsToProps, boolHtmlAttrsMap, htmlAttrsMap } from "./attributes";
import {
  RenderOptions,
  Key,
  RenderNodeList,
  RenderNode,
  RenderElement,
  RenderTextNode,
} from "./types";

export function renderNode(
  node: RenderNode,
  key?: Key,
  options: RenderOptions = {}
): ReactNode {
  const { mapNode, mapElement, components } = options;
  const _node = (mapNode || identity)(node, key, options);
  //@ts-ignore
  const nodeType = _node?.nodeType;

  if (!nodeType) {
    return _node as ReactNode;
  }

  if (nodeType === 3) {
    return (<RenderTextNode>_node).nodeValue;
  }

  if (nodeType === 1) {
    const { childNodes, tagName } = <RenderElement>_node;
    const tag = tagName.toLowerCase();
    const children = childNodes.length
      ? renderNodes(childNodes, options)
      : null;
    const props = Object.assign(
      { key, children },
      attrsToProps(
        <RenderElement>_node,
        Object.assign({}, htmlAttrsMap, boolHtmlAttrsMap, options.attrsMap)
      )
    );
    const mapComponent = components?.[tag];

    const reactNode = mapComponent
      ? mapComponent(props)
      : createElement(tag, props);

    return mapElement && isValidElement(reactNode)
      ? mapElement(reactNode)
      : reactNode;
  }
}

export function renderNodes(
  nodeList: RenderNodeList,
  options?: RenderOptions
): ReactNode[] {
  return Array.from(nodeList).reduce<ReactNode[]>(
    (acc, node, key) => (acc.push(renderNode(node, key, options)), acc),
    []
  );
}
