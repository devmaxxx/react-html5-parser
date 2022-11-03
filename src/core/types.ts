import { AllHTMLAttributes, ReactElement, ReactHTML } from "react";

export type Attributes = AllHTMLAttributes<Element>;
export type AtributesPropKeys = keyof Attributes;
export type AtributesMap = Partial<Record<string, AtributesPropKeys>>;

export type NodeType = keyof ReactHTML;
type Components = Record<
  NodeType | string,
  (props: Attributes) => ReactElement
>;

export type RenderOptions = {
  components?: Partial<Components>;
};

export type PureParseOptions = RenderOptions & {
  sanitize?: (html: string) => string;
};
