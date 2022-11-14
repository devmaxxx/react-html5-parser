import { SVG_ATTRIBUTES } from "../src/core/constants";
import {
  htmlAttrsMap,
  boolHtmlAttrsMap,
  parseAttrs,
  attrsToProps,
} from "../src/core/attributes";
import { possibleStandardNames } from "./possibleStandardNames";

// filter key=value attrs
function filterAttrs(
  attrs: {},
  includeKeys: string[] = [],
  excludeKeys: string[] = []
) {
  return Object.entries(attrs).reduce<any>((acc, [key, value]) => {
    if (
      (key !== value || includeKeys.includes(key)) &&
      !excludeKeys.includes(key)
    ) {
      acc[key] = value;
    }

    return acc;
  }, {});
}

function attrsObjToNode(attrs: Record<string, any>): any {
  const attributes = Object.entries(attrs).reduce<Attr[]>(
    (acc, [nodeName, nodeValue]) => (
      acc.push({ nodeName, nodeValue } as Attr), acc
    ),
    []
  );

  return {
    attributes,
    getAttribute: (name: string) => attrs[name],
  };
}

const allHtmlAttrsMap = { ...boolHtmlAttrsMap, ...htmlAttrsMap };

describe("#attributes", () => {
  it("should support all html/svg attributes", () => {
    // react only keys
    const excludeKeys = [
      "classname",
      "htmlfor",
      "dangerouslysetinnerhtml",
      "innerhtml",
    ];

    // have generated key=value prop
    const includeKeys = ["panose1", "panose-1"];

    const svgAttrsMap = parseAttrs(SVG_ATTRIBUTES);

    const allAttributes = {
      ...htmlAttrsMap,
      ...boolHtmlAttrsMap,
      ...svgAttrsMap,
    };

    // ignore prop with the same key value except "panose1"
    const possibleAttrs = filterAttrs(
      possibleStandardNames,
      includeKeys,
      excludeKeys
    );

    const htmlSvgAttrs = filterAttrs(allAttributes, includeKeys, excludeKeys);

    expect(possibleAttrs).toEqual(htmlSvgAttrs);
  });

  it("should transform boolean attrs", () => {
    const attributes = attrsObjToNode({
      allowfullscreen: "",
      allowpaymentrequest: "",
      async: "false",
      autofocus: "true",
      autoplay: "true",
      checked: "true",
      controls: "",
      default: "",
      draggable: "false",
      disabled: "disabled",
      formnovalidate: "true",
      hidden: "true",
      ismap: "",
      itemscope: "false",
      loop: "",
      multiple: "",
      muted: "",
      nomodule: "",
      novalidate: "true",
      open: "",
      playsinline: "",
      readonly: "",
      required: "",
      reversed: "false",
      selected: "",
      truespeed: "",
    });

    const attrs = attrsToProps(attributes, allHtmlAttrsMap);

    expect(attrs).toMatchInlineSnapshot(`
      {
        "allowFullScreen": true,
        "allowpaymentrequest": "",
        "async": true,
        "autoFocus": true,
        "autoPlay": true,
        "controls": true,
        "default": true,
        "defaultChecked": true,
        "disabled": true,
        "draggable": "false",
        "formNoValidate": true,
        "hidden": true,
        "ismap": "",
        "itemScope": true,
        "loop": true,
        "multiple": true,
        "muted": true,
        "noModule": true,
        "noValidate": true,
        "open": true,
        "playsInline": true,
        "readOnly": true,
        "required": true,
        "reversed": true,
        "selected": true,
        "truespeed": "",
      }
    `);
  });

  it.each([
    [{ download: "" }, { download: true }],
    [{ download: "filename" }, { download: "filename" }],
  ])("should transform specific boolean attrs: %p", (attrs, props) => {
    expect(attrsToProps(attrsObjToNode(attrs), allHtmlAttrsMap)).toEqual(props);
  });

  it.each([
    [{ checked: "" }, { defaultChecked: true }],
    [{ checked: "checked" }, { defaultChecked: true }],
    [{ value: "" }, { defaultValue: "" }],
    [{ value: "panose1" }, { defaultValue: "panose1" }],
    [
      { value: "panose1", type: "text" },
      { defaultValue: "panose1", type: "text" },
    ],
    [
      { value: "panose1", type: "submit" },
      { value: "panose1", type: "submit" },
    ],
    [
      { value: "panose1", type: "reset" },
      { value: "panose1", type: "reset" },
    ],
  ])(
    "should transform controlled attrs to uncontrolled: %p",
    (attrs, props) => {
      const attributes = attrsToProps(attrsObjToNode(attrs), allHtmlAttrsMap);

      expect(attributes).toEqual(props);
    }
  );
});
