import React from "react";
import { render, screen } from "@testing-library/react";
import { parse } from "../src";

describe("parse", () => {
  it("should be defined and function", () => {
    expect(parse).toBeDefined();
    expect(typeof parse).toBe("function");
  });

  it("should return string", () => {
    const data = parse("<span>Hello</span>");

    render(React.createElement("div", null, data));
    const elem = screen.getByText(/Hello/i);
    expect(elem).toBeInTheDocument();
  });
});
