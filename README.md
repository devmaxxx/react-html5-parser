# react-html5-parser

Fast, simple and small HTML to React parser for the browser and React Native, sanitized by default

## Install

```sh
npm install react-html5-parser
// or
yarn add react-html5-parser
```

Requires React 18 or newer (`react >= 18`). The native entry also needs React Native 0.71 or newer.

## Use

Three entry points:

| Import                      | Target       | Sanitizer                           | Size (min + gzip) |
| --------------------------- | ------------ | ----------------------------------- | ----------------- |
| `react-html5-parser`        | browser      | DOMPurify, on by default            | 15.1 kB           |
| `react-html5-parser/core`   | browser      | none, bring your own via `sanitize` | 3 kB              |
| `react-html5-parser/native` | React Native | built-in allowlist (see below)      | 26.5 kB           |

The browser entries map HTML and SVG attributes to React props.

```ts
import { parse } from "react-html5-parser";

// Parse element
parse("<div>Lorem ipsum</div>");
// return createElement(React.Fragment, {}, React.createElement("div", {}, "Lorem ipsum"))

// Parse element inside the string
parse("Lorem <div>ipsum</div>");
// return createElement(React.Fragment, {}, ["Lorem ", React.createElement("div", {}, "ipsum")])
```

## API

### parse `(html: string, options = {}) => React.Fragment | null`

#### Arguments

- `html`: The HTML string
- `options` (`object?`): Options
  - `purify` (`object?`): DOMPurify config for the default entry, see below
  - `sanitize` (`function?`): Transform or sanitize the HTML string before parsing. On the default entry DOMPurify still runs after it
  - `components` (`object?`): Override React elements. The keys are lowercase HTML tag names (such as `div`). Each value is rendered as a React component, so it may use hooks
  - `mapNode` (`function?`): Override Dom node
  - `mapElement` (`function?`): Override React element. Called after `components` override; for an overridden tag it receives the component element (`element.type` is the component)
  - `attrsMap` (`object?`): Map for converting dom attributes to react attributes
  - `onError` (`function?`): Listen errors, if we provide not a string `html` or catch an unexpected internal error

#### Return

Return `React.Fragment | null`. We get `null` if html is not a string or catch an unexpected internal error

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

### purify `DOMPurify.Config`

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

### sanitize `(html: string) => string`

```ts
import { parse } from "react-html5-parser/core";
import dompurify from "dompurify";

// your own DOMPurify setup on the core entry
parse("<div>Lorem ipsum</div>", {
  sanitize: (html: string) => dompurify.sanitize(html),
});
```

On the default entry, DOMPurify runs after your `sanitize`, so a function that only trims or rewrites the HTML never turns sanitizing off. Use the core entry to replace DOMPurify.

### components `{ [key: string]: (props: {}) => ReactNode }`

```tsx
function Typography(props) {
  return <span {...props} />;
}

// replace div with paragraph, and b with Typography
parse("<div>Lorem <b>ipsum</b></div>", {
  components: {
    div: (props) => <p {...props} />,
    b: Typography,
  },
});
```

JSX

```jsx
<>
  <p>
    Lorem <span>ipsum</span>
  </p>
</>
```

### mapNode `(node: Node, key: number | string, options = {}) => Node | ReactNode`

```ts
import { parse, renderNode, renderNodes } from "react-html5-parser";

parse("<div>Lorem <b>ipsum</b></div>", {
  mapNode: (node: Node, key: string | number, options = {}) => {
    // return renderNode(node, key, options); // render node as react node
    // return renderNodes(node.childNodes, options); // render only childNodes

    return node;
  },
});
```

### mapElement `(element: ReactElement) => ReactNode`

```ts
parse("<div>Lorem <b>ipsum</b></div>", {
  mapElement: (element: ReactElement) => {
    if (element.type === "p") {
      return <element.type {...element.props} />;
    }

    return element;
  },
});
```

### attrsMap `{ [key: string]: string }`

HTML and SVG attributes are mapped by default. `attrsMap` adds to or overrides that mapping.

```ts
import { parse } from "react-html5-parser";

// map custom attrs, convert classname to class
parse("<div classname='a'>Lorem <b>ipsum</b></div>", {
  attrsMap: { classname: "className" },
});
```

### onError `(error: unknown, html: unknown) => void`

```tsx
// if we provide incorrect html, or get internal error
const res: null = parse(undefined, {
  onError: (error: unknown, html: unknown) => {
    bugsnag.notify(error, (event) => {
      event.addMetadata("htmlparser", { html });
    });
  },
});
```

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
