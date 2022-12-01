import {
  CSSProperties,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from "react";
import * as domhandler from "domhandler";

export type { CSSProperties };
export type RenderNode = Node | domhandler.Node | domhandler.DataNode;
export type RenderTextNode = Node | domhandler.DataNode;
export type RenderElement = Element | domhandler.Element;
export type Attribute = { name: string; value: string };
export type RenderElementAttributes = Attribute[];
export type RenderNodeList = NodeListOf<Node> | RenderNode[];
export type Key = number | string;
export type Props = Record<string, string | number | boolean | CSSProperties>;
export type AttributesMap = Record<string, string>;
export type MapNodeFn = (
  node: RenderNode,
  key?: Key,
  options?: RenderOptions
) => Node | ReactNode;
export type ParserFn = (html: string) => any[];
export type MapElementFn = (element: ReactElement) => ReactNode;
export type MapComponentFn = (
  props: PropsWithChildren<Props & { key?: Key }>
) => ReactNode;
export type Components = Record<string, MapComponentFn>;
export type RenderOptions = {
  components?: Components;
  mapNode?: MapNodeFn;
  mapElement?: MapElementFn;
  attrsMap?: AttributesMap;
};
export type ParseOptions = RenderOptions & {
  sanitize?: (html: string) => string;
  parser?: ParserFn;
  onError?: (error: unknown, html: unknown) => void;
};
