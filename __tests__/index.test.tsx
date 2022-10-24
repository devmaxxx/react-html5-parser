import React from "react";
import { render, screen } from "@testing-library/react";
import parse from "../src";

describe("parse", () => {
  it("should be defined and function", () => {
    expect(parse).toBeDefined();
    expect(typeof parse).toBe("function");
  });

  it("should return string", () => {
    const node = parse(
      "<div class='active' style='color: red; font-size-adjust: initial; font-weight: 600' id>Hello <span>world</span><span>!</span><b></b></div>",
      { components: { span: (props) => <div {...props} /> } }
    );
    render(React.createElement("div", null, node));

    const element = screen.getByText(/Hello/i);

    expect(element).toBeInTheDocument();
    expect(element.className).toBe("active");
  });
});
