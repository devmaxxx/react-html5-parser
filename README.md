# react-html5-parser

Fast and small (2kb) HTML to React parser in browser

### Work still in progress

## Install

```sh
npm install react-html5-parser
// or
yarn add react-html5-parser
```

## Use

## To read

- parse only html attributes (1.1kb) (default)
- parse html and svg attributes (2kb) (need to update [attrsMap](#attrsMap) option)

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

### parse `(html: string, options = {}) => React.Fragment`

#### Arguments

- `html`: The HTML string
- `options` (`object?`): Options
  - `sanitize` (`function?`): Sanitize HTML string
  - `components` (`object?`): Override React elements. The keys are HTML equivalents (such as `div`)
  - `mapNode` (`function?`): Override Dom node
  - `mapElement` (`function?`): Override React element. Сalled after `components` override
  - `attrsMap` (`object?`): Map for converting dom attributes to react attributes

#### Return

Return `React.Fragment` with React nodes or empty, if `html` is not/empty `string`

### sanitize `(html: string) => string`

```ts
import { parse } from "react-html5-parser";
import dompurify from "dompurify";

// trim string
parse("<div>Lorem ipsum</div>", { sanitize: (html: string) => html.trim() });

// sanitize with dompurify
parse("<div>Lorem ipsum</div>", {
  sanitize: (html: string) => dompurify.sanitize(html),
});
```

### components `{ [key: string]: (props: {}) => ReactNode }`

```ts
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

```js
<p>
  Lorem <span>ipsum</span>
</p>
```

### mapNode `(node: Node, key: number | string, options = {}) => Node | ReactNode }`

```ts
import { parse, renderNode, renderNodes } from "react-html5-parser";

parse("<div>Lorem <b>ipsum</b></div>", {
  mapNode: (node: Node, key: string | number, options = {}) => {
    // return renderNode(node); // render node as react node
    // return renderNodes(node.childNodes); // render only childNodes

    return node;
  },
});
```

### mapElement `(element: ReactElement, options = {}) => ReactNode }`

```ts
parse("<div>Lorem <b>ipsum</b></div>", {
  mapElement: (element: ReactElement, options = {}) => {
    if (element.type === "p") {
      return <element.type {...element.props} />;
    }

    return element;
  },
});
```

### attrsMap `{ [key: string]: string }`

```ts
import { parse, parseAttrs, SVG_ATTRIBUTES } from "react-html5-parser";

// need for the correct parsing svg attributes
const svgAttrsMap = parseAttrs(SVG_ATTRIBUTES);

// map custom attrs, convert classname to class
const customMap = { classname: "class" };

parse("<div>Lorem <b>ipsum</b></div>", {
  attrsMap: { ...svgAttrsMap, ...customMap },
});
```
