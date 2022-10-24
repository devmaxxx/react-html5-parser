import { Config, sanitize } from "dompurify";

export type Html = string | Node;
export { Config };

export function parse(html: Html, config: Config) {
  return sanitize(html, {
    ...config,
    RETURN_DOM_FRAGMENT: true,
  });
}
