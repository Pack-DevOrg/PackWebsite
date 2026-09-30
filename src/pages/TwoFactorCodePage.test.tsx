import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

import {
  TWO_FACTOR_EXPIRED_HEADING,
  TWO_FACTOR_SENT_STATUS,
  TwoFactorCodeView,
  submitTwoFactorCodeBecauseTicket,
  type TwoFactorSubmitResult,
} from "./TwoFactorCodePage";

const TICKET = "ticket-single-use";
const CODE = "123456";

function renderView(
  submitCode: (ticket: string, code: string) => Promise<TwoFactorSubmitResult>,
  path = `/2fa/${TICKET}`,
) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider>
          <ThemeProvider>
            <Routes>
              <Route
                path="/2fa/:ticket"
                element={<TwoFactorCodeView submitCode={submitCode} />}
              />
            </Routes>
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("TwoFactorCodePage", () => {
  const consoleMethods = ["log", "info", "warn", "error", "debug"] as const;
  const spies: jest.SpyInstance[] = [];

  beforeEach(() => {
    for (const method of consoleMethods) {
      spies.push(jest.spyOn(console, method).mockImplementation(() => undefined));
    }
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    for (const spy of spies) {
      spy.mockRestore();
    }
    spies.length = 0;
    jest.restoreAllMocks();
  });

  function loggedText(): string {
    return spies
      .flatMap((spy) => spy.mock.calls.map((args) => args.map(String).join(" ")))
      .join("\n");
  }

  it("fills from the page: six digits post once and the field is one-time-code", async () => {
    const submitCode = jest.fn<Promise<TwoFactorSubmitResult>, [string, string]>(
      async () => ({ accepted: true }),
    );
    renderView(submitCode);

    const input = screen.getByLabelText("Verification code");
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: CODE } });

    await waitFor(() => {
      expect(submitCode).toHaveBeenCalledTimes(1);
    });
    expect(submitCode).toHaveBeenCalledWith(TICKET, CODE);
    expect(await screen.findByRole("status")).toHaveTextContent(TWO_FACTOR_SENT_STATUS);
    expect(screen.queryByDisplayValue(CODE)).not.toBeInTheDocument();
    expect(screen.queryByText(CODE)).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "654321" } });
    expect(submitCode).toHaveBeenCalledTimes(1);
  });

  it("refuses an expired ticket and does not keep the code on the page", async () => {
    const submitCode = jest.fn<Promise<TwoFactorSubmitResult>, [string, string]>(
      async () => ({ accepted: false, expired: true }),
    );
    renderView(submitCode);

    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: CODE },
    });

    expect(
      await screen.findByRole("heading", { name: TWO_FACTOR_EXPIRED_HEADING }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Verification code")).not.toBeInTheDocument();
    expect(screen.queryByText(CODE)).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("never writes the code into logs or browser storage", async () => {
    const submitCode = jest.fn<Promise<TwoFactorSubmitResult>, [string, string]>(
      async () => ({ accepted: true }),
    );
    renderView(submitCode);
    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: CODE },
    });
    await screen.findByRole("status");

    expect(loggedText()).not.toContain(CODE);
    expect(window.localStorage.getItem("2fa") ?? "").not.toContain(CODE);
    expect(JSON.stringify(window.sessionStorage)).not.toContain(CODE);
    expect(JSON.stringify(window.localStorage)).not.toContain(CODE);
  });

  it("posts the code in the body only and treats 410 as expired", async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      expect(url).not.toContain(CODE);
      expect(init?.method).toBe("POST");
      expect(String(init?.body)).toContain(CODE);
      expect(url).toContain(`/2fa/${TICKET}`);
      return {
        ok: false,
        status: 410,
        statusText: "Gone",
        text: async () => JSON.stringify({ reason: "expired" }),
      } as Response;
    });
    const originalFetch = global.fetch;
    global.fetch = fetchMock as typeof fetch;

    const result = await submitTwoFactorCodeBecauseTicket(TICKET, CODE);

    expect(result).toEqual({ accepted: false, expired: true });
    expect(loggedText()).not.toContain(CODE);
    global.fetch = originalFetch;
  });
});
