import { AllHTMLAttributes, CSSProperties } from "react";
import { camelCase } from "./utils";

export type Attributes = AllHTMLAttributes<Element>;
export type AtributesPropKeys = keyof Attributes;
export type AtributesMap = Partial<Record<string, AtributesPropKeys>>;

const attrs =
  "accept-charset accessKey allowFullScreen autoCapitalize autoComplete autoCorrect autoFocus autoPlay autoSave cellPadding cellSpacing charSet classID colSpan contentEditable contextMenu controlsList crossOrigin dateTime defaultChecked defaultValue disablePictureInPicture disableRemotePlayback encType enterKeyHint formMethod formAction formEncType formNoValidate formTarget frameBorder hrefLang http-equiv imageSizes imageSrcSet inputMode itemID itemProp itemRef itemScope itemType keyParams keyType marginWidth marginHeight maxLength mediaGroup minLength noModule noValidate playsInline radioGroup readOnly referrerPolicy rowSpan spellCheck srcDoc srcLang srcSet tabIndex useMap accent-height alignment-baseline allowReorder arabic-form attributeName attributeType autoReverse baseFrequency baseline-shift baseProfile calcMode cap-height clip-path clipPathUnits clip-rule color-interpolation color-interpolation-filters color-profile color-rendering contentScriptType contentStyleType diffuseConstant dominant-baseline edgeMode enable-background externalResourcesRequired fill-opacity fill-rule filterRes filterUnits flood-opacity flood-color font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical glyphRef gradientTransform gradientUnits horiz-adv-x horiz-origin-x image-rendering kernelMatrix kernelUnitLength keyPoints keySplines keyTimes lengthAdjust letter-spacing lighting-color limitingConeAngle marker-end markerHeight marker-mid marker-start markerUnits markerWidth maskContentUnits maskUnits numOctaves overline-position overline-thickness paint-order panose-1 pathLength patternContentUnits patternTransform patternUnits pointer-events pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY renderingIntent rendering-intent repeatCount repeatDur requiredExtensions requiredFeatures shape-rendering specularConstant specularExponent spreadMethod startOffset stdDeviation stitchTiles stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-width stroke-opacity suppressContentEditableWarning suppressHydrationWarning surfaceScale systemLanguage tableValues targetX targetY text-anchor text-decoration textLength text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic vector-effect vert-adv-y vert-origin-x vert-origin-y v-hanging v-ideographic viewBox viewTarget v-mathematical word-spacing writing-mode xChannelSelector x-height xlink:actuate xlink:arcrole xlink:href xlink:role xlink:show xlink:title xlink:type xml:base xml:lang xml:space xmlns:xlink yChannelSelector zoomAndPan";

export const attributesMap = attrs.split(" ").reduce<AtributesMap>(
  (acc, prop) => {
    const value = camelCase(prop) as AtributesPropKeys;

    acc[prop.toLowerCase()] = value;

    if (prop.match(/[-:]/)) {
      acc[value.toLowerCase()] = value;
    }

    return acc;
  },
  {
    class: "className",
    for: "htmlFor",
  }
);

export function styleToObject(style: string): CSSProperties {
  const st = style
    .replace(/\\*.*?\\*/g, "") // remove comments
    .split(/ ?; ?/)
    .reduce<Record<string, string | number>>((acc, prop: string) => {
      const [key, value] = prop.split(/ ?: ? /);

      if (key && value) {
        acc[camelCase(key)] = Number.isNaN(+value) ? value : +value;
      }

      return acc;
    }, {});

  return st;
}

export function attrsToProps(attrs: NamedNodeMap): Attributes {
  return Array.from(attrs).reduce<Attributes>((acc, attr) => {
    const nodeName = attr.nodeName;
    const nodeValue = attr.nodeValue;
    const attrKey = attributesMap[nodeName] || (nodeName as AtributesPropKeys);

    acc[attrKey] =
      attrKey === "style" && nodeValue ? styleToObject(nodeValue) : nodeValue;

    return acc;
  }, {});
}
