import {
  CSSProperties,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from "react";

export type { CSSProperties };

export type Key = number | string;
export type Attributes = Record<
  string,
  string | string[] | number | boolean | CSSProperties
>;
export type AttributesMap = Record<string, string>;
export type MapNodeFn = (
  node: Node,
  key?: Key,
  options?: RenderOptions
) => Node | ReactNode;
export type MapElementFn = (element: ReactElement) => ReactNode;
export type ComponentProps = PropsWithChildren<Attributes>;
export type MapComponentFn = (props: ComponentProps) => ReactNode;
export type Components = Record<string, MapComponentFn>;
export type RenderOptions = {
  components?: Components;
  mapNode?: MapNodeFn;
  mapElement?: MapElementFn;
  attrsMap?: AttributesMap;
};
export type BaseParseOptions = {
  sanitize?: (html: string) => string;
  onError?: (error: unknown, html: unknown) => void;
};
export type ParseOptions = RenderOptions & BaseParseOptions;
