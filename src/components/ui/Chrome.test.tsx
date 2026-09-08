import React from "react";
import { render, screen } from "@testing-library/react";

import {
  Button,
  Card,
  CloseButton,
  IconDisc,
  MicroLabel,
  PageHeader,
} from "./Chrome";

const BUTTON_VARIANTS = ["primary", "ghost", "glow", "destructive"] as const;

function stylesheetText(): string {
  return Array.from(document.querySelectorAll("style"))
    .map((node) => node.textContent ?? "")
    .join("\n");
}

function rulesFor(element: Element): string {
  const all = stylesheetText();
  const chunks: string[] = [];
  for (const cls of Array.from(element.classList)) {
    const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = all.match(new RegExp(`\\.${escaped}[^{]*\\{[^}]*\\}`, "g"));
    if (matches === null) {
      continue;
    }
    chunks.push(
      ...matches.map((rule) =>
        rule.replace(new RegExp(`\\.${escaped}`, "g"), "._")
      )
    );
  }
  return chunks.join("\n");
}

function declaredValue(css: string, property: string): string | undefined {
  const match = css.match(new RegExp(`${property}\\s*:\\s*([^;}]+)`, "i"));
  if (match === null) {
    return undefined;
  }
  const value = match[1];
  if (value === undefined) {
    return undefined;
  }
  return value.trim();
}

function isAbsentOrNone(value: string | undefined): boolean {
  if (value === undefined) {
    return true;
  }
  const normalized = value.toLowerCase();
  return (
    normalized === "none" ||
    normalized === "unset" ||
    normalized === "initial" ||
    normalized === ""
  );
}

describe("Chrome primitives", () => {
  it("renders Card, PageHeader, IconDisc, CloseButton, Button, and MicroLabel", () => {
    render(
      <>
        <Card>card body</Card>
        <PageHeader title="Header title" subtitle="Header subtitle">
          disc
        </PageHeader>
        <IconDisc>glyph</IconDisc>
        <CloseButton onClick={() => undefined} />
        <Button>primary action</Button>
        <MicroLabel>eyebrow</MicroLabel>
      </>
    );

    expect(screen.getByText("card body")).toBeInTheDocument();
    expect(screen.getByText("Header title")).toBeInTheDocument();
    expect(screen.getByText("Header subtitle")).toBeInTheDocument();
    expect(screen.getByText("disc")).toBeInTheDocument();
    expect(screen.getByText("glyph")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "primary action" })
    ).toBeInTheDocument();
    expect(screen.getByText("eyebrow")).toBeInTheDocument();
  });

  it("uses var(--color-text-on-accent) for primary Button text, never white", () => {
    render(<Button variant="primary">Go</Button>);
    const button = screen.getByRole("button", { name: "Go" });
    const css = rulesFor(button);

    expect(css).toContain("var(--color-text-on-accent)");
    expect(css).not.toMatch(/#fff(?:fff)?\b/i);
    expect(css).not.toMatch(/rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)/i);
    expect(css).not.toMatch(/(?:^|[:\s])white(?:\s|;|$)/i);
    expect(button).toHaveStyle({ color: "var(--color-text-on-accent)" });
  });

  it("keeps Card free of box-shadow and backdrop-filter", () => {
    const { container } = render(<Card>flat</Card>);
    const card = container.firstElementChild;
    if (card === null) {
      throw new Error("Card did not render a root element");
    }
    const css = rulesFor(card);

    expect(isAbsentOrNone(declaredValue(css, "box-shadow"))).toBe(true);
    expect(isAbsentOrNone(declaredValue(css, "backdrop-filter"))).toBe(true);
  });

  it("tints IconDisc from the color prop with the 1F/33 pair", () => {
    const color = "#2196F3";
    const { container } = render(<IconDisc color={color}>i</IconDisc>);
    const disc = container.firstElementChild;
    if (disc === null) {
      throw new Error("IconDisc did not render a root element");
    }
    const css = rulesFor(disc);

    expect(css).toContain(`${color}1F`);
    expect(css).toContain(`${color}33`);
  });

  it("snapshots each Button variant", () => {
    const serialized = BUTTON_VARIANTS.map((variant) => {
      const { container, unmount } = render(
        <Button variant={variant}>{variant}</Button>
      );
      const button = container.firstElementChild;
      if (button === null) {
        throw new Error(`Button ${variant} did not render`);
      }
      const css = rulesFor(button);
      unmount();
      return `variant:${variant}\n${css}`;
    }).join("\n");
    expect(serialized).toMatchInlineSnapshot(`
      "variant:primary
      ._{display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-weight:600;letter-spacing:0.02em;border-radius:var(--radius-l);padding:var(--space-2) var(--space-3);min-height:2.5rem;background:linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-soft) 100%);color:var(--color-text-on-accent);border:1px solid var(--color-accent);}
      variant:ghost
      ._{display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-weight:600;letter-spacing:0.02em;border-radius:var(--radius-l);padding:var(--space-2) var(--space-3);min-height:2.5rem;background:transparent;color:var(--color-accent);border:1px solid var(--color-accent);}
      variant:glow
      ._{display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-weight:600;letter-spacing:0.02em;border-radius:var(--radius-l);padding:var(--space-2) var(--space-3);min-height:2.5rem;background:var(--color-surface);color:var(--color-accent);border:1px solid var(--color-accent);}
      variant:destructive
      ._{display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-weight:600;letter-spacing:0.02em;border-radius:var(--radius-l);padding:var(--space-2) var(--space-3);min-height:2.5rem;background:var(--color-error);color:var(--color-text-on-secondary);border:1px solid var(--color-error);}"
    `);
  });

  it("snapshots Card", () => {
    const { container } = render(<Card>body</Card>);
    const card = container.firstElementChild;
    if (card === null) {
      throw new Error("Card did not render");
    }
    expect(rulesFor(card)).toMatchInlineSnapshot(
      `"._{background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-card);box-shadow:none;backdrop-filter:none;}"`
    );
  });

  it("snapshots PageHeader", () => {
    const { container } = render(
      <PageHeader title="Title" subtitle="Sub" accessory={<span>extra</span>}>
        icon
      </PageHeader>
    );
    const header = container.firstElementChild;
    if (header === null) {
      throw new Error("PageHeader did not render");
    }
    expect(rulesFor(header)).toMatchInlineSnapshot(
      `"._{display:flex;align-items:center;gap:var(--space-2);text-align:left;}"`
    );
  });

  it("snapshots IconDisc", () => {
    const { container } = render(<IconDisc color="#2196F3">i</IconDisc>);
    const disc = container.firstElementChild;
    if (disc === null) {
      throw new Error("IconDisc did not render");
    }
    expect(rulesFor(disc)).toMatchInlineSnapshot(
      `"._{width:32px;height:32px;border-radius:var(--radius-disc);display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#2196F31F;border:1px solid #2196F333;color:#2196F3;}"`
    );
  });

  it("snapshots CloseButton", () => {
    const { container } = render(<CloseButton onClick={() => undefined} />);
    const close = container.firstElementChild;
    if (close === null) {
      throw new Error("CloseButton did not render");
    }
    expect(rulesFor(close)).toMatchInlineSnapshot(
      `"._{width:34px;height:34px;border-radius:var(--radius-disc);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;padding:0;cursor:pointer;background:var(--color-background-subtle);border:1px solid var(--color-border-subtle);color:var(--color-text-primary);font-size:1rem;line-height:1;}"`
    );
  });

  it("snapshots MicroLabel", () => {
    const { container } = render(<MicroLabel>label</MicroLabel>);
    const label = container.firstElementChild;
    if (label === null) {
      throw new Error("MicroLabel did not render");
    }
    expect(rulesFor(label)).toMatchInlineSnapshot(
      `"._{display:inline-block;text-transform:uppercase;letter-spacing:var(--tracking-eyebrow);font-size:0.75rem;font-weight:700;color:var(--color-text-secondary);}"`
    );
  });
});
