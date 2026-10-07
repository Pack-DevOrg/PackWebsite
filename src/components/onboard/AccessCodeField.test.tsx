import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ACCESS_CODE_LABEL,
  ACCESS_CODE_SUBMIT,
  AccessCodeField,
  accessCodeErrorLine,
  accessCodeFromSearch,
} from "./AccessCodeField";

describe("accessCodeFromSearch", () => {
  it("reads and normalizes code from the query", () => {
    expect(accessCodeFromSearch("?code=ab c1")).toBe("ABC1");
    expect(accessCodeFromSearch("?access_code=xy9")).toBe("XY9");
    expect(accessCodeFromSearch("")).toBe("");
  });
});

describe("accessCodeErrorLine", () => {
  it("maps reasons to lines and falls back for unknown ones", () => {
    expect(accessCodeErrorLine(null)).toBe("");
    expect(accessCodeErrorLine("expired")).toBe("That code has expired.");
    expect(accessCodeErrorLine("weird")).toMatch(/couldn't redeem/);
  });
});

describe("AccessCodeField", () => {
  it("prefills from initialCode and submits the normalized code", () => {
    const onSubmit = jest.fn();
    render(<AccessCodeField initialCode="abc 123" onSubmit={onSubmit} />);
    const input = screen.getByLabelText(ACCESS_CODE_LABEL) as HTMLInputElement;
    expect(input.value).toBe("ABC123");
    fireEvent.click(screen.getByText(ACCESS_CODE_SUBMIT));
    expect(onSubmit).toHaveBeenCalledWith("ABC123");
  });

  it("disables submit when empty or submitting", () => {
    const onSubmit = jest.fn();
    const { rerender } = render(<AccessCodeField onSubmit={onSubmit} />);
    expect(screen.getByText(ACCESS_CODE_SUBMIT)).toBeDisabled();
    rerender(<AccessCodeField initialCode="A" submitting onSubmit={onSubmit} />);
    expect(screen.getByText(ACCESS_CODE_SUBMIT)).toBeDisabled();
  });

  it("shows the error line", () => {
    render(<AccessCodeField errorReason="used" onSubmit={jest.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("already been used");
  });
});
