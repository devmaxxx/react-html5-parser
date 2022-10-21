import dompurify, { Config } from "dompurify";

export type Html = string | Node;
export { Config };

export function parse(html: Html, config: Config) {
  return dompurify.sanitize(html, {
    ...config,
    RETURN_DOM_FRAGMENT: true,
  });
}
