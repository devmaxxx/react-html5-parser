import React from "react";
import { parse } from "../src";

describe("parse error handling", () => {
  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a number", 1],
    ["an object", {}],
    ["an array", ["<p>x</p>"]],
  ])("returns null and reports a TypeError for %s", (_, html) => {
    const onError = jest.fn();

    // @ts-expect-error non-string input from untyped callers
    expect(parse(html, { onError })).toBeNull();
    expect(onError).toHaveBeenCalledWith(
      new TypeError("HTML must be a string"),
      html
    );
  });

  it("returns null without throwing when no onError is given", () => {
    // @ts-expect-error non-string input from untyped callers
    expect(parse(undefined)).toBeNull();
  });

  it("reports an error thrown by sanitize", () => {
    const error = new Error("sanitize failed");
    const onError = jest.fn();

    const node = parse("<p>x</p>", {
      sanitize: () => {
        throw error;
      },
      onError,
    });

    expect(node).toBeNull();
    expect(onError).toHaveBeenCalledWith(error, "<p>x</p>");
  });

  it("reports a sanitize result that is not a string", () => {
    const onError = jest.fn();

    // @ts-expect-error sanitize returning a non-string
    parse("<p>x</p>", { sanitize: () => undefined, onError });

    expect(onError).toHaveBeenCalledWith(
      new TypeError("Sanitized HTML must be a string"),
      undefined
    );
  });

  it.each([
    [
      "mapNode",
      {
        mapNode: () => {
          throw new Error("boom");
        },
      },
    ],
    [
      "mapElement",
      {
        mapElement: () => {
          throw new Error("boom");
        },
      },
    ],
  ])("reports an error thrown by %s", (_, options) => {
    const onError = jest.fn();

    expect(parse("<p>x</p>", { ...options, onError })).toBeNull();
    expect(onError).toHaveBeenCalledWith(new Error("boom"), "<p>x</p>");
  });

  it("lets an error rethrown from onError reach the caller", () => {
    expect(() =>
      // @ts-expect-error non-string input from untyped callers
      parse(null, {
        onError: (error) => {
          throw error;
        },
      })
    ).toThrow(TypeError);
  });

  it("reports nesting too deep for the call stack instead of throwing", () => {
    const onError = jest.fn();

    expect(parse("<div>".repeat(20000), { onError })).toBeNull();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "RangeError" }),
      expect.any(String)
    );
  });

  it("ignores an onError that is not a function", () => {
    // @ts-expect-error onError of the wrong type from untyped callers
    expect(parse(null, { onError: "nope" })).toBeNull();
  });
  it("treats null options as no options", () => {
    expect(parse("<p>x</p>", null)).not.toBeNull();
  });
});
