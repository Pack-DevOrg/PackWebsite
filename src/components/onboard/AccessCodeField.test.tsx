import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiRequestError } from "@/api/client";
import {
  AccessCodeField,
  accessCodeFromSearch,
  ACCESS_CODE_LABEL,
} from "./AccessCodeField";

const request = jest.fn();
jest.mock("@/api/client", () => ({
  ...jest.requireActual("@/api/client"),
  createApiClient: () => ({ request }),
}));

function field(initialCode?: string, onRedeemed = jest.fn()) {
  render(
    <AccessCodeField
      initialCode={initialCode}
      getAccessToken={async () => "t"}
      tokenType="Bearer"
      onRedeemed={onRedeemed}
    />,
  );
  return onRedeemed;
}

describe("AccessCodeField", () => {
  beforeEach(() => request.mockReset());

  it("pre-fills from ?code=", () => {
    field(accessCodeFromSearch("?code=abcd2345"));
    expect(screen.getByLabelText(ACCESS_CODE_LABEL)).toHaveValue("ABCD2345");
  });

  it("posts a valid code and advances", async () => {
    request.mockResolvedValue({});
    const onRedeemed = field("ABCD2345");
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(onRedeemed).toHaveBeenCalled());
    expect(request).toHaveBeenCalledWith({
      path: "/access/redeem",
      method: "POST",
      body: { code: "ABCD2345" },
    });
  });

  it("shows one line for an invalid code and does not advance", async () => {
    request.mockRejectedValue(
      new ApiRequestError(400, "bad", { error: { details: { reason: "expired" } } }),
    );
    const onRedeemed = field("ABCD2345");
    fireEvent.click(screen.getByRole("button"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That code has expired.",
    );
    expect(onRedeemed).not.toHaveBeenCalled();
  });
});
