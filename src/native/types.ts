import { ReactNode } from "react";
import { ImageStyle, StyleProp, TextStyle, ViewStyle } from "react-native";
import { BaseParseOptions, MapElementFn } from "../core/types";

export type NativeTagStyle = {
  view?: StyleProp<ViewStyle>;
  text?: StyleProp<TextStyle>;
  image?: StyleProp<ImageStyle>;
};
export type NativeComponentProps = {
  [attribute: string]: ReactNode;
  children?: ReactNode;
};
export type NativeComponentFn = (props: NativeComponentProps) => ReactNode;
export type NativeParseOptions = BaseParseOptions & {
  components?: Record<string, NativeComponentFn>;
  tagStyles?: Record<string, NativeTagStyle>;
  textStyle?: StyleProp<TextStyle>;
  onLinkPress?: (href: string) => void;
  mapElement?: MapElementFn;
};
