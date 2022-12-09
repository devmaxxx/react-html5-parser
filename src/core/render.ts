import { ReactNode, createElement, isValidElement } from "react";
import { identity, isNode, isString } from "./utils";
import { attrsToProps } from "./attributes";
import {
  RenderOptions,
  Key,
  RenderNodeList,
  RenderNode,
  RenderElement,
  MapNodeFn,
} from "./types";

export const renderNode = (
  node: RenderNode,
  key: Key,
  options: RenderOptions
): ReactNode => {
  const { mapElement, components } = options;
  const { nodeType, nodeValue } = node;

  if (nodeType === 3) return nodeValue;

  if (nodeType === 1) {
    const { childNodes, tagName, attributes } = node as RenderElement;
    const props = Object.assign(
      {
        key,
        children: childNodes.length ? renderNodes(childNodes, options) : null,
      },
      attrsToProps(Array.from(attributes), options)
    );
    const reactNode = (mapElement || identity)(
      createElement(tagName.toLowerCase(), props)
    );
    const mapComponent =
      components &&
      isValidElement(reactNode) &&
      isString(reactNode.type) &&
      components[reactNode.type];

    return mapComponent
      ? mapComponent(Object.assign({}, reactNode.props))
      : reactNode;
  }
};

export const renderNodes = (
  nodeList: RenderNodeList,
  options: RenderOptions
): ReactNode[] =>
  Array.from(nodeList).reduce<ReactNode[]>((acc, node, key) => {
    try {
      let _node: ReturnType<MapNodeFn> = (options.mapNode || identity)(
        node,
        key,
        options
      );

      acc.push(
        isNode(_node)
          ? renderNode(_node, key, options)
          : Array.isArray(_node)
          ? renderNodes(_node, options)
          : _node
      );
    } catch (error) {
      options.onError(error);
    }

    return acc;
  }, []);
