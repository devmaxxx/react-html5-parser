import { htmlAttrsMap, svgAttrsMap } from "../src/core/attributes";
import { possibleStandardNames } from "./possibleStandardNames";

describe("#attributes", () => {
  it("should support all html attributes", () => {
    // react only keys
    const excludeKeys = [
      "classname",
      "htmlfor",
      "dangerouslysetinnerhtml",
      "innerhtml",
    ];

    const includeKeys = ["panose1", "panose-1"];

    // ignore prop with the same key value except "panose1"
    const htmlAttrs = Object.entries(possibleStandardNames).reduce<any>(
      (acc, [key, value]) => {
        if (
          (key !== value || includeKeys.includes(key)) &&
          !excludeKeys.includes(key)
        ) {
          acc[key] = value;
        }

        return acc;
      },
      {}
    );

    const allAttributes = {
      ...htmlAttrsMap,
      ...svgAttrsMap,
    };

    expect(htmlAttrs).toEqual(allAttributes);
  });
});
