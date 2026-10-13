import { Platform, TextStyle, ViewStyle } from "react-native";

type BlockStyle = { view?: ViewStyle; text?: TextStyle };

const bold: TextStyle = { fontWeight: "bold" };
const italic: TextStyle = { fontStyle: "italic" };
const underline: TextStyle = { textDecorationLine: "underline" };
const lineThrough: TextStyle = { textDecorationLine: "line-through" };
// Android has no Menlo and iOS has no generic `monospace` family.
const mono: TextStyle = {
  fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
};
const spaced: ViewStyle = { marginVertical: 8 };

function heading(fontSize: number): BlockStyle {
  return { view: spaced, text: { fontSize, fontWeight: "bold" } };
}

export const LINK_STYLE: TextStyle = { color: "#0645ad", ...underline };
export const MARKER_STYLE: TextStyle = { width: 24 };

export const INLINE_STYLES: Record<string, TextStyle> = {
  a: {},
  abbr: {},
  b: bold,
  bdi: {},
  bdo: {},
  cite: italic,
  code: mono,
  data: {},
  del: lineThrough,
  dfn: italic,
  em: italic,
  font: {},
  i: italic,
  ins: underline,
  kbd: mono,
  label: {},
  mark: { backgroundColor: "#ff0" },
  q: {},
  s: lineThrough,
  samp: mono,
  small: {},
  span: {},
  strike: lineThrough,
  strong: bold,
  sub: {},
  sup: {},
  time: {},
  tt: mono,
  u: underline,
  var: italic,
};

export const BLOCK_STYLES: Record<string, BlockStyle> = {
  address: { text: italic },
  article: {},
  aside: {},
  blockquote: {
    view: {
      ...spaced,
      paddingLeft: 12,
      borderLeftWidth: 3,
      borderLeftColor: "#ccc",
    },
  },
  caption: {},
  center: {},
  dd: { view: { marginLeft: 16 } },
  details: {},
  div: {},
  dl: { view: spaced },
  dt: { text: bold },
  fieldset: {},
  figcaption: {},
  figure: { view: spaced },
  footer: {},
  form: {},
  h1: heading(32),
  h2: heading(24),
  h3: heading(18.72),
  h4: heading(16),
  h5: heading(13.28),
  h6: heading(10.72),
  header: {},
  hr: { view: { height: 1, backgroundColor: "#ccc", marginVertical: 8 } },
  li: { view: { flexDirection: "row" } },
  main: {},
  nav: {},
  ol: { view: spaced },
  p: { view: spaced },
  pre: { view: spaced, text: mono },
  section: {},
  summary: { text: bold },
  table: { view: spaced },
  tbody: {},
  td: { view: { flex: 1, padding: 4 } },
  tfoot: {},
  th: { view: { flex: 1, padding: 4 }, text: bold },
  thead: {},
  tr: { view: { flexDirection: "row" } },
  ul: { view: spaced },
};

// Nothing in these renders as content in a native view, and media or frames
// would fetch remote resources.
export const DROPPED_TAGS =
  /^(applet|area|audio|base|canvas|datalist|dialog|embed|frame|frameset|head|iframe|input|link|map|math|meta|noembed|noframes|noscript|object|option|param|portal|script|select|source|style|svg|template|textarea|title|track|video)$/;

// An allowlist: a scheme React Native would hand to another app (`intent:`,
// custom app schemes) or to a webview (`javascript:`) is never opened.
const SAFE_LINK = /^(https?|mailto|tel):/i;
const SAFE_IMAGE = /^(https?:|data:image\/(png|jpe?g|gif|webp);)/i;

export function isSafeLink(href: string) {
  return SAFE_LINK.test(href.trim());
}

export function isSafeImage(src: string) {
  return SAFE_IMAGE.test(src.trim());
}
