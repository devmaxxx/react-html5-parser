import {
  AllHTMLAttributes,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from "react";

export type Key = number | string;
export type Attributes = AllHTMLAttributes<Element>;
export type AtributesPropKeys = keyof Attributes;
export type AtributesMap = Partial<Record<string, AtributesPropKeys>>;
export type MapNodeFn = (
  node: Node,
  key: Key,
  options: RenderOptions
) => Node | ReactNode;
export type MapElementFn = (element: ReactElement) => ReactNode;
export type MapComponentFn = (
  props: PropsWithChildren<Attributes & { key: Key }>
) => ReactNode;
export type Components = Record<string, MapComponentFn>;
export type RenderOptions = {
  components?: Partial<Components>;
  mapNode?: MapNodeFn;
  mapElement?: MapElementFn;
};
export type ParseOptions = RenderOptions & {
  sanitize?: (html: string) => string;
};
