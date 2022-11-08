# react-html5-parser

## Install

```sh
npm install react-html5-parser
// or
yarn add react-html5-parser
```

## Use

```ts
import { parse } from "react-html5-parser";
// or
import { parse } from "react-html5-parser/sanitize";

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

#### Return

Return `React.Fragment` with React nodes or empty, if `html` is not/empty `string`

### sanitize `(html: string) => string`

```ts
import { parse } from "react-html5-parser";
import xss from "xss";

// trim string
parse("<div>Lorem ipsum</div>", { sanitize: (html: string) => html.trim() });

// sanitize with xss
parse("<div>Lorem ipsum</div>", { sanitize: xss });
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
