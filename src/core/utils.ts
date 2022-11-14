export function camelCase(value: string) {
  return value.replace(/[-:](\w)/g, (_, $1) => $1.toUpperCase());
}

export function identity<T>(value: T): T {
  return value;
}

export function boolAttrValue(value: unknown, nodeName?: string) {
  return !value || (nodeName == "download" ? value : !!value);
}
