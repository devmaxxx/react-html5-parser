import {
  CSSProperties,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from "react";

export type { CSSProperties };

export type Attribute = { name: string; value: string };
export type AttributesMap = Record<string, string>;
export type Attributes = Attribute[] | ArrayLike<Attribute>;
export type ParserChildNodes = ParserNode[] | ArrayLike<ParserNode>;
export type ParserNode = {
  nodeType: number;
  nodeValue?: string | null;
  childNodes?: ParserChildNodes;
};
export type ParserElement = ParserNode & {
  tagName: string;
  attributes: Attributes;
  childNodes: ParserChildNodes;
};
export type RenderNode = ParserNode;
export type RenderElement = ParserElement;
export type RenderNodeList = ParserChildNodes;
export type Key = number | string;
export type PropKey = string;
export type PropValue = string | number | boolean | CSSProperties;
export type PropArr = [PropKey, PropValue];
export type PropMapRes = PropArr | null | void | undefined;
export type Props = Record<PropKey, PropValue>;
export type MapNodeFn = (
  node: any,
  key?: Key,
  options?: RenderOptions
) => ParserNode | ParserNode[] | ReactNode;
export type ParserFn = (html: string) => ParserChildNodes;
export type MapElementFn = (element: ReactElement) => ReactNode;
export type MapComponentProps = PropsWithChildren<Props & { key?: Key }>;
export type MapComponentFn = (props: MapComponentProps) => ReactNode;
export type Components = Record<string, MapComponentFn>;
export type CommonOptions = {
  attrsMap: AttributesMap;
  components?: Components;
  mapNode?: MapNodeFn;
  mapElement?: MapElementFn;
  mapAttr?: (propArr: PropArr, attr: Attribute) => PropMapRes;
};
export type RenderOptions = CommonOptions & {
  onError: (error: unknown) => void;
};
export type ParseOptions = Partial<CommonOptions> & {
  sanitize?: (html: string) => string;
  onError?: (error: unknown, data: { html: string }) => void;
};
