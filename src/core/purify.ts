import DOMPurify, { Config } from "dompurify";
import { STYLE_COMMENTS_REGEX } from "./constants";
import { RenderOptions } from "./types";

type Purifier = ReturnType<typeof DOMPurify>;

let purifier: Purifier | undefined;
let purifierWindow: Window | undefined;

const FIXED_POSITION_TEXT = /position\s*:\s*fixed/i;
// Browsers drop control characters and spaces from a URL before reading its
// scheme, so `java\tscript:` still runs.
const URL_IGNORED_CHARS = /[\u0000- ]/g;
const JS_URL = /^javascript:/i;

// The renderer re-parses the style text with its own regex, which also picks
// up declarations the CSSOM discards (`}position:fixed`). Checking the text as
// well keeps the guard from disagreeing with what is rendered.
function setsFixedPosition(node: Element) {
  const style = node.getAttribute("style") || "";

  return (
    /^fixed$/i.test((node as HTMLElement).style?.position || "") ||
    FIXED_POSITION_TEXT.test(style.replace(STYLE_COMMENTS_REGEX, ""))
  );
}

// `position: fixed` escapes every container and can lay an invisible click
// target over the whole page. Attributes of mapped custom elements skip
// DOMPurify's URL checks, so a `javascript:` value is removed here before it
// reaches a component that might put it in an href.
function afterSanitizeAttributes(node: Element) {
  if (!node.hasAttribute) {
    return;
  }

  if (setsFixedPosition(node)) {
    node.removeAttribute("style");
  }

  for (const { name, value } of Array.from(node.attributes)) {
    if (JS_URL.test(value.replace(URL_IGNORED_CHARS, ""))) {
      node.removeAttribute(name);
    }
  }

  // `target` is kept for links that open a new tab; the opened page must not
  // get a handle back to this one.
  if (node.hasAttribute("target")) {
    node.setAttribute("rel", "noopener noreferrer");
  }
}

// A private instance: hooks added here must not change the sanitizing of an
// app that uses DOMPurify itself. It is bound to one window, so a new one
// (a reset test DOM, another realm) gets its own.
function getPurifier() {
  if (!purifier || purifierWindow !== window) {
    purifierWindow = window;
    purifier = DOMPurify(window);
    purifier.addHook("afterSanitizeAttributes", afterSanitizeAttributes);
  }

  return purifier;
}

// Only what leaves the fragment: DOMPurify's defaults already stop scripts.
// React 19 hoists <title> into <head>, <style> restyles the whole page, and
// `form` / `formaction` submit the page's own form to another origin.
const DEFAULT_CONFIG: Config = {
  ADD_ATTR: ["target"],
  FORBID_TAGS: ["style", "title"],
  FORBID_ATTR: ["form", "formaction"],
};

// The tree is sanitized where it lies and then rendered, so options that
// return a new string or node, or that expect a whole document, cannot apply.
const IGNORED_KEYS = [
  "RETURN_DOM",
  "RETURN_DOM_FRAGMENT",
  "RETURN_TRUSTED_TYPE",
  "WHOLE_DOCUMENT",
] as const;

// Sanitizes the parsed tree itself rather than a string, so what DOMPurify
// checked is exactly what gets rendered: no second parse, no mutation XSS.
export function purifyTree(
  root: Element,
  options: RenderOptions,
  purifyConfig: Config = {}
) {
  // The renderer looks components up by lowercase tag name, so any other key
  // never renders as a component and must not let its tag through.
  const mapped = Object.keys(options.components || {}).filter(
    (name) => name == name.toLowerCase()
  );

  const config: Config = { ...DEFAULT_CONFIG, ...purifyConfig };
  const addTags = config.ADD_TAGS;

  IGNORED_KEYS.forEach((key) => delete config[key]);

  getPurifier().sanitize(root, {
    ...config,
    IN_PLACE: true,
    // Mapped tags render as the caller's components, so DOMPurify must not
    // drop them as unknown elements, nor strip the custom attributes that are
    // their props. Event handlers still go.
    ADD_TAGS:
      typeof addTags == "function"
        ? (tagName: string) => mapped.includes(tagName) || addTags(tagName)
        : mapped.concat(addTags || []),
    CUSTOM_ELEMENT_HANDLING: config.CUSTOM_ELEMENT_HANDLING || {
      tagNameCheck: (tagName: string) => mapped.includes(tagName),
      attributeNameCheck: (name: string) => !/^on/i.test(name),
      allowCustomizedBuiltInElements: false,
    },
  });
}
