export const camelCase = (value: string) =>
  value.replace(/[-:](\w)/g, (_, $1) => $1.toUpperCase());

export const identity = <T>(value: T): T => value;

export const boolAttrValue = (value: unknown, nodeName?: string) =>
  !value || (nodeName === "download" ? value : !!value);

export const isString = (value: unknown): value is string =>
  typeof value === "string";

export const isNode = (value: unknown): value is Node =>
  !!value && typeof value === "object" && "nodeType" in value;
