# Changelog

## 1.0.2

- README: new header, features list, table of contents, install command for pnpm, and a note that the browser entries need a DOM.

## 1.0.1

- `exports` names the type file for each entry and module format, so TypeScript picks `.d.ts` for `import` and `.d.cts` for `require` without guessing.
- The package ships `CHANGELOG.md`, and `author` names the maintainer.

## 1.0.0

The default entry now sanitizes, and React Native gets its own entry.

### Breaking changes

- **React 18 or newer.** The `react` peer range moves from `>=16.8.0` to `>=18.0.0`. The native entry also needs `react-native >=0.71`.
- **`parse` sanitizes by default.** `parse` from `react-html5-parser` runs DOMPurify over the parsed tree. Output that used to render can now be stripped:
  - `<script>`, event handlers (`onclick`), `javascript:` URLs, `<iframe>`, `<embed>` and `<object>`;
  - `<style>` and `<title>`, which act on the whole page;
  - the `form` and `formaction` attributes;
  - `style` attributes that set `position: fixed`;
  - attributes outside DOMPurify's allowlist, such as `contenteditable` and `fetchpriority`;
  - unknown and custom elements, unless the tag is mapped in `components` (their content is kept).
- **Bigger default entry.** It grows from about 1.4 kB to about 15 kB min + gzip, because DOMPurify is bundled. Import from `react-html5-parser/core` to keep the old size and behaviour.
- **`sanitize` no longer replaces the sanitizer on the default entry.** DOMPurify runs after your `sanitize` function. To use only your own sanitizer, import from `/core`.
- **`components` entries render as React components.** They were called as plain functions before. Hooks inside them now work, but an inline arrow function remounts its subtree on every render, and a component that returns `undefined` throws on React 18. Define components outside render and return `null` for nothing.
- **`mapElement` receives the component element** for a tag mapped in `components`, not the element the component returned.
- **`MapComponentFn` props no longer include `key`.** The type is now `ComponentProps` (`PropsWithChildren<Attributes>`).

### Added

- `react-html5-parser/core`: the unsanitized parser, about 3 kB.
- `react-html5-parser/native`: renders HTML to React Native `View`, `Text` and `Image`, with `components`, `tagStyles`, `textStyle`, `onLinkPress` and `mapElement` options. Links open only for `http`, `https`, `mailto` and `tel`; images load only from `http`, `https` and raster data URIs.
- `purify` option on the default entry: a DOMPurify config merged over the built-in one.
- CommonJS builds next to ESM for every entry.

### Fixed

- SVG attributes (`viewBox`, `stroke-width`, `xlink:href` and the rest) map to their React names by default.
- Form fields render uncontrolled (`defaultValue`, `defaultChecked`), so React no longer warns about a `value` without `onChange`.
- On React 19, `<script async>` is rendered inert instead of hoisted and run, and `<html>` / `<body>` no longer bind to the page's own.
- Custom elements keep their attribute names as written.
- `attrsMap` applies to every element, including mapped components.

### Upgrading

See [Upgrading from 0.x](README.md#upgrading-from-0x).
