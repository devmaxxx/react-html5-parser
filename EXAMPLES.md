# Examples

Recipes for [react-html5-parser](README.md). Each one is self-contained; the [API section of the README](README.md#api) explains every option.

- [Render CMS content in a component](#render-cms-content-in-a-component)
- [Next.js links and images](#nextjs-links-and-images)
- [Heading anchors](#heading-anchors)
- [Syntax-highlighted code blocks](#syntax-highlighted-code-blocks)
- [Lazy images and scrollable tables](#lazy-images-and-scrollable-tables)
- [Custom elements as components](#custom-elements-as-components)
- [Allow YouTube embeds](#allow-youtube-embeds)
- [Bring your own sanitizer](#bring-your-own-sanitizer)
- [Server rendering](#server-rendering)
- [React Native article](#react-native-article)

## Render CMS content in a component

Parse once per HTML string, keep `components` at module scope, and show a fallback when parsing fails.

```tsx
import { useMemo } from "react";
import { parse, type Components } from "react-html5-parser";

const components: Components = {
  table: ({ children, ...props }) => (
    <div className="table-scroll">
      <table {...props}>{children}</table>
    </div>
  ),
};

export function Article({ html }: { html: string }) {
  const content = useMemo(
    () =>
      parse(html, {
        components,
        onError: (error, html) => reportError({ error, html }),
      }),
    [html]
  );

  return (
    <article className="prose">
      {content ?? <p>This article could not be displayed.</p>}
    </article>
  );
}
```

`components` defined inside `Article` would be a new object on every render, so React would see a new component type per tag and remount the whole tree.

## Next.js links and images

Internal links go through the router; external links open in a new tab. Images with known dimensions go through `next/image`.

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Components } from "react-html5-parser";

export const components: Components = {
  a: ({ href, children }) => {
    const url = String(href ?? "");

    return url.startsWith("/") ? (
      <Link href={url}>{children}</Link>
    ) : (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  img: ({ src, alt, width, height }) =>
    width && height ? (
      <Image
        src={String(src)}
        alt={String(alt ?? "")}
        width={Number(width)}
        height={Number(height)}
      />
    ) : (
      <img src={String(src)} alt={String(alt ?? "")} loading="lazy" />
    ),
};
```

Remote image hosts must be listed in `images.remotePatterns` in `next.config.js`.

## Heading anchors

Give every `h2` and `h3` a linkable id, generated from its text when the HTML has none.

```tsx
import type { ReactNode } from "react";
import type { Components } from "react-html5-parser";

function textOf(node: ReactNode): string {
  if (typeof node == "string" || typeof node == "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join("");
  }
  if (node && typeof node == "object" && "props" in node) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w]+/g, "-");
}

function heading(Tag: "h2" | "h3") {
  return ({ id, children }: { id?: unknown; children?: ReactNode }) => {
    const anchor = String(id || slugify(textOf(children)));

    return (
      <Tag id={anchor}>
        <a href={`#${anchor}`}>{children}</a>
      </Tag>
    );
  };
}

export const components: Components = {
  h2: heading("h2"),
  h3: heading("h3"),
};
```

## Syntax-highlighted code blocks

Rich-text editors usually write `<pre><code class="language-ts">`. Replace `pre` and read the language from the inner `code` element.

```tsx
import { isValidElement, type ReactElement } from "react";
import { Highlight } from "prism-react-renderer";
import type { Components } from "react-html5-parser";

type CodeProps = { className?: string; children?: string | string[] };

export const components: Components = {
  pre: ({ children }) => {
    const [code] = [children].flat();

    if (!isValidElement(code) || code.type != "code") {
      return <pre>{children}</pre>;
    }

    const { className = "", children: text } = (code as ReactElement<CodeProps>)
      .props;
    const language = className.replace(/^language-/, "") || "text";

    return (
      <Highlight code={[text].flat().join("")} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={className} style={style}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    );
  },
};
```

## Lazy images and scrollable tables

`mapElement` adjusts props without replacing a tag; `mapNode` can wrap or drop DOM nodes before they render.

```tsx
import { cloneElement, type ReactElement } from "react";
import { parse, renderNode } from "react-html5-parser";

parse(html, {
  mapElement: (element: ReactElement) =>
    element.type == "img"
      ? cloneElement(element, { loading: "lazy", decoding: "async" })
      : element,

  mapNode: (node, key, options) => {
    // Rich-text editors leave empty paragraphs behind.
    if (node.nodeName == "P" && !node.textContent?.trim()) {
      return null;
    }

    if (node.nodeName == "TABLE") {
      // Without `mapNode: undefined`, renderNode would call this function
      // on the same table again, forever.
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

## Custom elements as components

Unknown tags are removed by the sanitizer and their content is kept. A tag you map in `components` is allowed, along with its attributes (minus event handlers and `javascript:` values).

```tsx
import { parse } from "react-html5-parser";

parse('<x-callout type="warning">Back up your data first.</x-callout>', {
  components: {
    "x-callout": ({ type, children }) => (
      <aside className={`callout callout-${String(type ?? "info")}`}>
        {children}
      </aside>
    ),
  },
});
// <><aside className="callout callout-warning">Back up your data first.</aside></>
```

This is a safe way to let authors place your own widgets in HTML content.

## Allow YouTube embeds

Frames are removed by default. Mapping `iframe` in `components` lets it through the sanitizer, and the component decides which sources render.

```tsx
import { parse } from "react-html5-parser";

const YOUTUBE = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[\w-]+$/;

parse(html, {
  components: {
    iframe: ({ src, title }) =>
      typeof src == "string" && YOUTUBE.test(src) ? (
        <iframe
          src={src}
          title={String(title ?? "YouTube video")}
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : null,
  },
});
```

Always check `src` in the component: a mapped `iframe` passes the sanitizer with any http(s) source.

## Bring your own sanitizer

The core entry skips DOMPurify (3 kB instead of 15 kB). Use it when the HTML is already trusted, or pass your own sanitizer.

```tsx
import { parse } from "react-html5-parser/core";
import sanitizeHtml from "sanitize-html";

parse(html, {
  sanitize: (html) =>
    sanitizeHtml(html, {
      allowedTags: ["p", "a", "b", "i", "ul", "ol", "li", "br"],
      allowedAttributes: { a: ["href"] },
    }),
});
```

`sanitize` runs on the string before parsing. On the default entry it runs before DOMPurify, never instead of it.

## Server rendering

The browser entries parse with the DOM, so on the server `parse` returns `null` and reports a `ReferenceError` to `onError`. Render the HTML on the client, and show a placeholder until then:

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { parse } from "react-html5-parser";

export function ClientHtml({ html }: { html: string }) {
  const [content, setContent] = useState<ReactNode>(null);

  useEffect(() => {
    setContent(parse(html));
  }, [html]);

  return <div className="prose">{content}</div>;
}
```

If the content matters for SEO, sanitize the HTML on the server with your own tool and render it there instead.

## React Native article

Style tags, open links in an in-app browser, and replace images.

```tsx
import { Image, ScrollView } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { parse } from "react-html5-parser/native";

const tagStyles = {
  h1: { text: { fontSize: 28, fontWeight: "700", marginBottom: 12 } },
  p: { view: { marginBottom: 12 } },
  a: { text: { color: "#0a66c2" } },
  code: { text: { fontFamily: "Menlo", backgroundColor: "#f2f2f2" } },
};

export function Article({ html }: { html: string }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {parse(html, {
        tagStyles,
        textStyle: { fontSize: 16, lineHeight: 24 },
        onLinkPress: (href) => {
          // onLinkPress receives every link, relative ones included;
          // checking the URL is up to you.
          if (/^https?:\/\//.test(href)) {
            WebBrowser.openBrowserAsync(href);
          }
        },
      })}
    </ScrollView>
  );
}
```

Without `onLinkPress`, links open through `Linking` for `http:`, `https:`, `mailto:` and `tel:` only.
