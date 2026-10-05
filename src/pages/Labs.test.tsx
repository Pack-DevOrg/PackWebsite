import React from "react";
import { render } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { LabsHomePage } from "./Labs";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

jest.mock("@/assets/logo.png", () => "logo.png");

const hrefsAt = (path: string): string[] => {
  const { container } = render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider>
          <ThemeProvider>
            <Routes>
              <Route path="*" element={<LabsHomePage />} />
            </Routes>
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
  return Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href") ?? "");
};

describe("Labs home", () => {
  it.each(["/labs", "/es/labs"])("links the planner corpus review but not DeeperBench at %s", (path) => {
    const hrefs = hrefsAt(path);
    expect(hrefs.some((h) => h.includes("planner-corpus-review"))).toBe(true);
    expect(hrefs.filter((h) => h.includes("deeperbench"))).toEqual([]);
  });
});
