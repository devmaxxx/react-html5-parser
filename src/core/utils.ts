export function camelCase(value: string) {
  return value.replace(/[-:](\w)/g, (_, $1) => $1.toUpperCase());
}

export function identity<T>(value: T): T {
  return value;
}

// A present boolean attribute is true whatever its value; only `download`
// carries a meaningful value (the file name).
export function boolAttrValue(value: string, nodeName?: string) {
  return nodeName == "download" && value ? value : true;
}

// Plain-object lookups would resolve tag or attribute names such as
// `constructor` to Object.prototype members.
export function own<T>(map: Record<string, T> | undefined, key: string) {
  return map && Object.prototype.hasOwnProperty.call(map, key)
    ? map[key]
    : undefined;
}
