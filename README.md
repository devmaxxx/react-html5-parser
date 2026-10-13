# react-html5-parser

Fast, simple and small HTML to React parser for the browser and React Native, sanitized by default

[![npm version](https://img.shields.io/npm/v/react-html5-parser)](https://www.npmjs.com/package/react-html5-parser)
[![CI](https://img.shields.io/github/actions/workflow/status/devmaxxx/react-html5-parser/ci.yml?branch=main&label=CI)](https://github.com/devmaxxx/react-html5-parser/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

- Turns an HTML string into React elements, with no `dangerouslySetInnerHTML`.
- Sanitized by default with DOMPurify, run on the parsed tree so nothing is parsed twice.
- Swap any tag for your own component, or rewrite nodes and elements as they render.
- A 3 kB core entry for when you bring your own sanitizer.
- A React Native entry that renders `View`, `Text` and `Image`.
- Never throws on bad input: returns `null` and reports through `onError`.
- ESM and CommonJS builds, with TypeScript types.

## Install

```sh
npm install react-html5-parser
# or
yarn add react-html5-parser
```

Requires React 18 or newer (`react >= 18`). The native entry also needs React Native 0.71 or newer.

## Use

Three entry points, one `parse` signature:

```ts
import { parse } from "react-html5-parser"; // untrusted HTML, browser
import { parse } from "react-html5-parser/core"; // trusted HTML, browser
import { parse } from "react-html5-parser/native"; // React Native
```

| Entry     | Use for                        | Sanitizer                             | Size\*  |
| --------- | ------------------------------ | ------------------------------------- | ------- |
| default   | HTML from users, a CMS or APIs | [DOMPurify](#built-in-sanitizer)      | 15.3 kB |
| `/core`   | HTML you trust or sanitize     | your own, via [`sanitize`](#sanitize) | 3 kB    |
| `/native` | React Native apps              | [built-in allowlist](#react-native)   | 26.6 kB |

The browser entries render DOM elements and SVG; the native entry renders `View`, `Text` and `Image`. The built-in sanitizers are always on.

\*Minified and gzipped, dependencies included. Each entry loads only its own code, so `/core` never pulls in DOMPurify.

Not sure? Use the default entry; switching later changes only the import.

```tsx
import { useMemo } from "react";
import { parse } from "react-html5-parser";

function Article({ html }: { html: string }) {
  // Parsing walks the whole string; redo it only when the HTML changes.
  const content = useMemo(() => parse(html), [html]);

  return <article>{content}</article>;
}
```

`parse` returns a `React.Fragment`, so text around the tags is kept:

```tsx
parse("Hello <b>world</b>");
// <>Hello <b>world</b></>
```

User HTML is sanitized before it renders:

```tsx
parse('<img src="x" onerror="alert(1)"><a href="javascript:alert(1)">hi</a>');
// <><img src="x" /><a>hi</a></>
```

More recipes, such as Next.js links and images, heading anchors, code highlighting, YouTube embeds, server rendering and React Native, are in [EXAMPLES.md](EXAMPLES.md).

## API

### parse

```ts
function parse(html: string, options?: ParseOptions | null): ReactNode;
```

Each entry exports its own `parse` with the same signature. The options differ:

| Entry                       | Options type            |
| --------------------------- | ----------------------- |
| `react-html5-parser`        | `SanitizedParseOptions` |
| `react-html5-parser/core`   | `ParseOptions`          |
| `react-html5-parser/native` | `NativeParseOptions`    |

**Returns** a `React.Fragment` holding the rendered nodes. An empty string gives an empty fragment. `parse` never throws for bad input: it returns `null` and calls `onError` instead (see [Errors](#errors)).

#### Options

All options are optional.

| Option                                  | Type                                          | Entries       | What it does                                                |
| --------------------------------------- | --------------------------------------------- | ------------- | ----------------------------------------------------------- |
| [`purify`](#purify)                     | `DOMPurify.Config`                            | default       | Adjusts the built-in DOMPurify config.                      |
| [`sanitize`](#sanitize)                 | `(html: string) => string`                    | all           | Transforms the HTML string before parsing.                  |
| [`components`](#components)             | `{ [tag: string]: (props) => ReactNode }`     | all           | Renders a tag with your component.                          |
| [`mapNode`](#mapnode)                   | `(node, key?, options?) => Node \| ReactNode` | default, core | Replaces, wraps or drops a DOM node before it renders.      |
| [`mapElement`](#mapelement)             | `(element: ReactElement) => ReactNode`        | all           | Replaces or adjusts each React element after it is created. |
| [`attrsMap`](#attrsmap)                 | `{ [attr: string]: string }`                  | default, core | Adds or overrides attribute → prop name mappings.           |
| [`onError`](#onerror)                   | `(error: unknown, html: unknown) => void`     | all           | Receives every error `parse` catches.                       |
| `tagStyles`, `textStyle`, `onLinkPress` | see [React Native](#react-native)             | native        | Styles and link handling for native components.             |

#### How a string becomes React elements

On the browser entries, in order:

1. `sanitize(html)` runs on the string, if given.
2. The string is parsed inside a `<template>` element, so nothing runs or loads.
3. Default entry only: DOMPurify cleans the parsed tree in place, with `purify` merged over the built-in config.
4. Each node goes through `mapNode`. A DOM node it returns renders as below; anything else is used as is.
5. A text node becomes a string. An element's attributes become props through the built-in map plus `attrsMap` (`class` → `className`, `style` → an object, `value` → `defaultValue`, …).
6. The element renders as its tag in `components` if mapped, or as the plain tag.
7. `mapElement` receives the created element; what it returns is rendered.

### Built-in sanitizer

`parse` from `react-html5-parser` sanitizes with [DOMPurify](https://github.com/cure53/DOMPurify). It runs on the parsed DOM tree in place, not on a string, so the tree DOMPurify checked is exactly the tree that gets rendered: no second parse and no mutation XSS. It uses a private DOMPurify instance, so an app's own DOMPurify setup and hooks are not affected.

On top of DOMPurify's defaults (no scripts, event handlers, `javascript:` URLs, frames, embeds or DOM clobbering ids), it removes only what reaches past the parsed fragment:

- `<style>` and `<title>`, which act on the whole page;
- `form` and `formaction`, which submit the page's own form to another site;
- a `style` attribute that sets `position: fixed`, which can lay content over the whole page;
- any attribute whose value is a `javascript:` URL.

It keeps `target` on links and sets `rel="noopener noreferrer"` with it. DOMPurify's allowlist still drops attributes such as `contenteditable` and `fetchpriority`.

Unknown and custom elements are removed and their content is kept, except tags you map in `components`: those are allowed. A mapped custom element (`x-card`) also keeps its custom attributes as props, without event handlers or `javascript:` values.

Limits worth knowing:

- CSS can still move content outside its box (`position: absolute`, negative margins, transforms). Put `contain: paint` on the element that holds the parsed HTML to clip it.
- Attributes such as `popovertarget` and `commandfor` stay, and can open the page's own popovers and dialogs by id. Forbid them through `purify` if that matters.
- An `id` such as `APP_CONFIG` still becomes `window.APP_CONFIG` when the page defines no global of that name. Do not read optional globals from `window` on pages that render user HTML.

### purify

`DOMPurify.Config`

Default entry only. Merged over the built-in config, so each key you pass replaces the built-in one; `ADD_TAGS` is combined with the tags mapped in `components`.

```ts
import { parse } from "react-html5-parser";

parse(html, {
  purify: {
    ADD_ATTR: ["contenteditable"],
    FORBID_ATTR: ["form", "formaction", "popovertarget", "commandfor"],
  },
});
```

The tree is always sanitized in place, so `IN_PLACE`, `RETURN_DOM`, `RETURN_DOM_FRAGMENT`, `RETURN_TRUSTED_TYPE` and `WHOLE_DOCUMENT` are ignored. The `position: fixed`, `javascript:` and `rel="noopener"` checks run whatever the config says.

### sanitize

`(html: string) => string`

```ts
import { parse } from "react-html5-parser/core";
import dompurify from "dompurify";

// your own DOMPurify setup on the core entry
parse("<div>Lorem ipsum</div>", {
  sanitize: (html: string) => dompurify.sanitize(html),
});
```

On the default entry, DOMPurify runs after your `sanitize`, so a function that only trims or rewrites the HTML never turns sanitizing off. Use the core entry to replace DOMPurify.

### components

`{ [tag: string]: (props) => ReactNode }`

Replace a tag with your own component. Keys are lowercase tag names. The component gets the tag's attributes as props, already mapped to React names (`class` → `className`), plus `children`.

```tsx
import { Link } from "react-router";
import { parse, type Components } from "react-html5-parser";

// Module scope: a new object on every render would give each tag a new
// component type, and React would remount the whole tree.
const components: Components = {
  // Internal links go through the router, external ones open in a new tab.
  a: ({ href, children }) =>
    typeof href == "string" && href.startsWith("/") ? (
      <Link to={href}>{children}</Link>
    ) : (
      <a href={String(href)} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  h2: ({ id, children }) => (
    <h2 id={id ? String(id) : undefined} className="article-heading">
      {children}
    </h2>
  ),
};

parse('<h2 id="intro">Intro</h2><p>Read the <a href="/docs">docs</a>.</p>', {
  components,
});
// <>
//   <h2 id="intro" className="article-heading">Intro</h2>
//   <p>Read the <Link to="/docs">docs</Link>.</p>
// </>
```

Components render inside React, so they may use hooks and context.

### mapNode

`(node: Node, key?: number | string, options?) => Node | ReactNode`

Runs on every DOM node before it renders. Return the node (or another DOM node) to render it as usual, or return a React node to render that instead. `null` drops the node.

```tsx
import { parse, renderNode } from "react-html5-parser";

parse(html, {
  mapNode: (node, key, options) => {
    // Drop empty paragraphs left by rich-text editors.
    if (node.nodeName == "P" && !node.textContent?.trim()) {
      return null;
    }

    // Wrap wide tables in a scroll container. Render the table itself
    // without mapNode, or renderNode would call this function again forever.
    if (node.nodeName == "TABLE") {
      return (
        <div key={key} className="table-scroll">
          {renderNode(node, key, { ...options, mapNode: undefined })}
        </div>
      );
    }

    return node;
  },
});
```

`renderNode` and `renderNodes` are exported for this: `renderNodes(node.childNodes, options)` renders only a node's content.

### mapElement

`(element: ReactElement) => ReactNode`

Runs on every React element after it is created, `components` included. Use it to adjust props without replacing the tag.

```tsx
import { cloneElement, type ReactElement } from "react";
import { parse } from "react-html5-parser";

parse(html, {
  mapElement: (element: ReactElement) =>
    element.type == "img"
      ? cloneElement(element, { loading: "lazy", decoding: "async" })
      : element,
});
```

### attrsMap

`{ [attr: string]: string }`

HTML and SVG attributes are mapped by default. `attrsMap` adds to or overrides that mapping.

```tsx
import { parse } from "react-html5-parser";

// Turn the CMS's tooltip attribute into a native title.
parse("<abbr data-tooltip='HyperText Markup Language'>HTML</abbr>", {
  attrsMap: { "data-tooltip": "title" },
});
// <><abbr title="HyperText Markup Language">HTML</abbr></>
```

On the default entry DOMPurify runs first and removes attributes it does not know, so a nonstandard attribute such as `classname` needs `purify: { ADD_ATTR: ["classname"] }` before `attrsMap` can see it. `data-*` and `aria-*` attributes are always kept.

### onError

`(error: unknown, html: unknown) => void`

`parse` never throws for bad input; it calls `onError` and returns `null`. Use that to show a fallback and report the error.

```tsx
function Article({ html }: { html: string }) {
  const content = useMemo(
    () =>
      parse(html, {
        onError: (error, html) => reportError({ error, html }),
      }),
    [html]
  );

  return content ?? <p>This article could not be displayed.</p>;
}
```

See [Errors](#errors) for every case that reaches `onError`.

### Other exports

The default and core entries also export:

- `renderNode(node, key?, options?)` and `renderNodes(nodes, options?)`: render DOM nodes the way `parse` does. Use them inside `mapNode`.
- `parseAttrs(attrs: string, initial?)`: builds an attribute map like the built-in one from a space-separated list, mapping each name and its lowercase form to camelCase (`stroke-width` → `strokeWidth`).
- `SVG_ATTRIBUTES`: the space-separated list of SVG attributes the built-in map covers.
- Types: `ParseOptions`, `RenderOptions`, `Components`, `ComponentProps`, `MapNodeFn`, `MapElementFn`, `AttributesMap`; plus `SanitizedParseOptions` and `PurifyConfig` from the default entry, and `NativeParseOptions`, `NativeTagStyle`, `NativeComponentProps` from the native entry.

## React Native

```tsx
import { parse } from "react-html5-parser/native";

function Article({ html }: { html: string }) {
  return <View>{parse(html, { textStyle: { fontSize: 16 } })}</View>;
}
```

React Native has no DOM, so this entry parses with [htmlparser2](https://github.com/fb55/htmlparser2), bundled into the entry so it also works with Metro versions that ignore package `exports`. Tags become native components:

- Block tags (`p`, `div`, `h1`–`h6`, `blockquote`, `pre`, `ul`, `ol`, `li`, `table`, `tr`, `td`, `hr`, …) become `View`. Their text is wrapped in `Text`, since React Native throws on a string directly inside a `View`.
- Inline tags (`b`, `strong`, `i`, `em`, `u`, `s`, `code`, `span`, `a`, …) become nested `Text`. A block inside inline content becomes `Text` too, on a line of its own.
- `img` becomes `Image`. Give it `width` and `height` in pixels: without both it takes the full width at a 16:9 ratio. Inside text, such as in a link, React Native shows an image only with both set.
- `br` becomes a line break. Whitespace collapses as in HTML, except inside `pre`.
- Unknown tags render only their content.

Options: `components`, `mapElement`, `sanitize` and `onError` work as on the web, plus:

- `tagStyles` (`{ [tag]: { view?, text?, image? } }`): merged over the default style of each tag.
- `textStyle`: the base style of all text.
- `onLinkPress` (`(href: string) => void`): handles every link tap, relative links included. You are responsible for checking the URL.

`components` receives the tag's attributes as props, except `style` (CSS text, which React Native rejects), `key`, `ref` and `children`, and the rendered children.

There is no script engine, so the native sanitizer guards what React Native can reach:

- links open through `Linking` only for `http:`, `https:`, `mailto:` and `tel:`; any other scheme, including app schemes and `intent:`, renders as plain text;
- images load only from `http:`, `https:` and base64 PNG, JPEG, GIF or WebP data URIs;
- `script`, `style`, `iframe`, `object`, `embed`, `svg`, `math`, `video`, `audio`, form controls and `head` content are dropped, as is any element with `hidden`;
- `style` attributes are ignored, so injected markup cannot overlay the app.

Remote images still reveal the reader's IP address to the image host. Map `img` in `components` to block or proxy them.

## Errors

`parse` never throws for bad input. It returns `null` and calls `onError(error, html)` when:

- `html`, or the result of `sanitize`, is not a string (`TypeError`);
- `sanitize`, `mapNode` or `mapElement` throws;
- there is no DOM, e.g. on the server (`ReferenceError`);
- the HTML nests deeper than the call stack allows (`RangeError`; browsers cap parser depth at about 512, so this only shows up outside them).

An error thrown inside `onError` reaches the caller. A component from `components` renders later, inside React, so its errors go to the nearest error boundary, not to `onError`.

## Notes

- HTML is parsed inside a `<template>` element, so scripts never run and images never load while parsing.
- `key`, `ref` and `children` attributes are ignored, since React would read them as its own props.
- Form fields stay uncontrolled: `value` / `checked` on `<input>`, the text of a `<textarea>` and the `selected` options of a `<select>` become `defaultValue` / `defaultChecked`. A file input's `value` is dropped, since React throws on it.
- `<noscript>` content is parsed as text, as browsers do while scripting is enabled.
- `hidden="until-found"` becomes plain `hidden`: React 19 treats `hidden` as a boolean.
- In the core entry, `async` is dropped from `<script>`, so React 19 renders it inert instead of hoisting and running it, and `<title>`, `<meta>` and `<link>` are hoisted into the document `<head>` by React 19.

## Development

```sh
git clone https://github.com/devmaxxx/react-html5-parser.git
cd react-html5-parser
npm install
npm test             # typecheck + Jest
npm run build        # tsdown to dist/ (ESM + CJS + types), then publint
npm run build:size   # build, then check the size limits above
```

## Contributing

Issues and pull requests are welcome at [github.com/devmaxxx/react-html5-parser](https://github.com/devmaxxx/react-html5-parser). For a bug, include the HTML string and the options you passed to `parse`. A pull request should come with a test in `__tests__/` and keep `npm test` and `npm run build:size` green.

## License

[MIT](LICENSE.md)
