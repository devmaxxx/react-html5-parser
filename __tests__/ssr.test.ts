/**
 * @jest-environment node
 */
import { parse } from "../src";
import { parse as parseCore } from "../src/core";

describe.each([
  ["main", parse],
  ["core", parseCore],
])("%s parse without a DOM", (_, parseHtml) => {
  it("returns null and reports the missing DOM", () => {
    const onError = jest.fn();

    expect(parseHtml("<p>x</p>", { onError })).toBeNull();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ReferenceError" }),
      "<p>x</p>"
    );
  });
});
