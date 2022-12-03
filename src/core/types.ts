import {
  CSSProperties,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from "react";
// import * as domhandler from "domhandler";

export type { CSSProperties };
export type RenderNode = Node;
export type RenderElement = Element;
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
) => Node | RenderNode[] | ReactNode;
export type ParserFn = (html: string) => any[];
export type MapElementFn = (element: ReactElement) => ReactNode;
export type MapComponentProps = PropsWithChildren<Props & { key?: Key }>;
export type MapComponentFn = (props: MapComponentProps) => ReactNode;
export type Components = Record<string, MapComponentFn>;
export type CommonOptions = {
  components?: Components;
  mapNode?: MapNodeFn;
  mapElement?: MapElementFn;
  attrsMap: AttributesMap;
};
export type RenderOptions = CommonOptions & {
  onError: (error: unknown) => void;
};
export type ParseOptions = Partial<CommonOptions> & {
  sanitize?: (html: string) => string;
  parser?: ParserFn;
  onError?: (error: unknown, data: { html: string }) => void;
};
