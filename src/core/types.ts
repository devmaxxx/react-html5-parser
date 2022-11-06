import { AllHTMLAttributes, PropsWithChildren, ReactNode } from "react";

export type Key = number | string;
export type Attributes = AllHTMLAttributes<Element>;
export type AtributesPropKeys = keyof Attributes;
export type AtributesMap = Partial<Record<string, AtributesPropKeys>>;
export type MapNodeFn = (
  node: Node,
  key: Key,
  options: RenderOptions
) => Node | ReactNode;
export type MapElementFn = (
  props: PropsWithChildren<Attributes & { key: Key }>,
  nodeName: string,
  options: RenderOptions
) => ReactNode;
export type Components = Record<string, MapElementFn>;

export type RenderOptions = {
  components?: Partial<Components>;
  mapNode?: MapNodeFn;
  mapElement?: MapElementFn;
};

export type PureParseOptions = RenderOptions & {
  sanitize?: (html: string) => string;
};
