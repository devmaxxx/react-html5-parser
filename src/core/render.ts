import { ReactNode, createElement, isValidElement } from "react";
import { identity } from "./utils";
import { attrsToProps, boolHtmlAttrsMap, htmlAttrsMap } from "./attributes";
import { RenderOptions, Key } from "./types";

export function getNodeList(html: string, _container?: HTMLElement) {
  try {
    _container = new DOMParser().parseFromString(html, "text/html").body;
  } catch (_) {
    _container = document.createElement("div");
    _container.innerHTML = html;
  }

  return _container.childNodes;
}

export function renderNode(
  node: Node,
  key?: Key,
  options: RenderOptions = {}
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
    const { childNodes, nodeName } = _node as Element;
    const _nodeName = nodeName.toLowerCase();
    const children = childNodes.length
      ? renderNodes(childNodes, options)
      : null;
    const props = Object.assign(
      { key, children },
      attrsToProps(
        _node as Element,
        Object.assign({}, htmlAttrsMap, boolHtmlAttrsMap, options.attrsMap)
      )
    );
    const mapComponent = components?.[_nodeName];

    const reactNode = mapComponent
      ? mapComponent(props)
      : createElement(_nodeName, props);

    return mapElement && isValidElement(reactNode)
      ? mapElement(reactNode)
      : reactNode;
  }
}

export function renderNodes(
  nodeList: NodeListOf<Node> | Node[],
  options?: RenderOptions
): ReactNode[] {
  return Array.from(nodeList).reduce<ReactNode[]>(
    (acc, node, key) => (acc.push(renderNode(node, key, options)), acc),
    []
  );
}
