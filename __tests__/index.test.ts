import React from "react";
import { render, screen } from "@testing-library/react";
import parse from "../src";

describe("parse", () => {
  it("should be defined and function", () => {
    expect(parse).toBeDefined();
    expect(typeof parse).toBe("function");
  });

  it("should return string", () => {
    const node = parse("<span class='active'>Hello</span>");
    render(React.createElement("div", null, node));

    const element = screen.getByText(/Hello/i);

    expect(element).toBeInTheDocument();
    expect(element.className).toBe("active");
  });
});
