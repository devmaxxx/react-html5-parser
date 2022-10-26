import { ReactElement, ReactHTML } from "react";
import { Attributes } from "./attributes";
import { Config, Html } from "./parser";

export type NodeType = keyof ReactHTML;
type Components = Record<
  NodeType,
  (props: Attributes, node: Element) => ReactElement
>;
export { Html };
export type Options = {
  components?: Partial<Components>;
  config?: Config;
};
