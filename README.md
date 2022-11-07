# react-html5-parser

## Install

```sh
npm install react-html5-parser
// or
yarn add react-html5-parser
```

## Usage

```js
import { parse } from "react-html5-parser";

parse("<div>Lorem ipsum</div>");
// createElement(React.Fragment, {}, React.createElement("div", {}, "Lorem ipsum"))
```
