import { Fragment, ReactNode, createElement } from "react";
import { identity, own } from "./utils";
import { attrsToProps } from "./attributes";
import { RenderOptions, Key, ComponentProps } from "./types";

// React reports whitespace text inside these as invalid DOM nesting.
const NO_TEXT_PARENTS = /^(table|thead|tbody|tfoot|tr|colgroup|select)$/;

export function getNodeList(
  html: string,
  sanitizeTree?: ((root: Element) => void) | false
) {
  // Template content is parsed in an inert document: scripts and image loads
  // never fire, and leading <style>/<title>/<link> stay in place instead of
  // being moved into a <head> that is then discarded.
  const template = document.createElement("template");

  // DOMParser used to drop leading whitespace, so indented input keeps
  // rendering without a stray text node.
  template.innerHTML = html.replace(/^[\t\n\f\r ]+/, "");

  if (!sanitizeTree) {
    return template.content.childNodes;
  }

  // Sanitizers work on an element root, not on a fragment.
  const root = template.content.ownerDocument.createElement("div");

  root.append(template.content);
  sanitizeTree(root);

  return root.childNodes;
}

function renderText(node: Node) {
  const parent = node.parentNode as Element | null;
  const isWhitespace = !node.nodeValue?.trim();

  if (isWhitespace && NO_TEXT_PARENTS.test(parent?.localName || "")) {
    return null;
  }

  return node.nodeValue;
}

function renderElement(
  element: Element,
  key?: Key,
  options: RenderOptions = {}
) {
  const { mapElement, components } = options;
  // `localName` keeps SVG case (`linearGradient`); HTML names are lowercase.
  const tagName = element.localName;

  // React 19 binds <html>, <head> and <body> to the page's own elements, even
  // when the parser lets them through inside SVG. Only their content renders.
  if (/^(html|head|body)$/.test(tagName)) {
    return createElement(
      Fragment,
      { key },
      renderNodes(element.childNodes, options)
    );
  }

  const props: ComponentProps & { key?: Key } = attrsToProps(
    element,
    options.attrsMap
  );

  if (tagName != "textarea" && element.childNodes.length) {
    props.children = renderNodes(element.childNodes, options);
  }

  props.key = key;

  const component = own(components, tagName.toLowerCase());
  const reactNode = createElement(component || tagName, props);

  return mapElement ? mapElement(reactNode) : reactNode;
}

export function renderNode(
  node: Node,
  key?: Key,
  options: RenderOptions = {}
): ReactNode {
  const mappedNode = (options.mapNode || identity)(node, key, options);

  if (!(mappedNode instanceof Node)) {
    return mappedNode;
  }

  if (mappedNode.nodeType === 3) {
    return renderText(mappedNode);
  }

  if (mappedNode.nodeType === 1) {
    return renderElement(mappedNode as Element, key, options);
  }

  return null;
}

export function renderNodes(
  nodeList: NodeListOf<Node> | Node[],
  options?: RenderOptions
): ReactNode[] {
  return Array.from(nodeList, (node, key) => renderNode(node, key, options));
}
