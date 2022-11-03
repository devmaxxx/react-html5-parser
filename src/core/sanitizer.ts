import Dom from "dompurify";

export type Config = Dom.Config;

export function sanitize(html: string, config: Dom.Config) {
  return Dom.sanitize(
    html,
    Object.assign(config, {
      RETURN_DOM_FRAGMENT: true,
    })
  ) as DocumentFragment;
}
