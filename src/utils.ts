export function camelCase(value: string) {
  return value.replace(/[-:](\w)/g, (_, $1) => $1.toUpperCase());
}
