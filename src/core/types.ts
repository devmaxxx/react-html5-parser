import { AllHTMLAttributes, ReactElement, ReactHTML } from "react";
import { Config } from "./sanitizer";

export type Attributes = AllHTMLAttributes<Element>;
export type AtributesPropKeys = keyof Attributes;
export type AtributesMap = Partial<Record<string, AtributesPropKeys>>;

export type NodeType = keyof ReactHTML;
type Components = Record<
  NodeType | string,
  (props: Attributes) => ReactElement
>;

export type Options = {
  components?: Partial<Components>;
  config?: Config;
};
