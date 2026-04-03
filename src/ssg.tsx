import React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";
import { StaticRouter } from "react-router-dom";
import { ServerStyleSheet } from "styled-components";
import { AppProviders, AppRoutes } from "./App";

export interface RenderResult {
  readonly html: string;
  readonly head: string;
}

type HelmetServerStateLike = {
  readonly title?: { toString(): string } | undefined;
  readonly meta?: { toString(): string } | undefined;
  readonly link?: { toString(): string } | undefined;
  readonly script?: { toString(): string } | undefined;
  readonly noscript?: { toString(): string } | undefined;
  readonly style?: { toString(): string } | undefined;
  readonly base?: { toString(): string } | undefined;
};

type HelmetContextLike = {
  readonly helmet?: HelmetServerStateLike | undefined;
};

const FILTERED_SSR_WARNING_PATTERNS = [
  "useLayoutEffect does nothing on the server",
];

function withFilteredSsrWarnings<T>(work: () => Promise<T>): Promise<T> {
  const originalConsoleError = console.error;

  console.error = (...args: unknown[]) => {
    const [firstArg] = args;
    if (
      typeof firstArg === "string" &&
      FILTERED_SSR_WARNING_PATTERNS.some((pattern) => firstArg.includes(pattern))
    ) {
      return;
    }

    originalConsoleError(...args);
  };

  return work().finally(() => {
    console.error = originalConsoleError;
  });
}

async function renderAppToString(app: React.ReactElement, url: string): Promise<string> {
  const stream = new PassThrough();
  const chunks: string[] = [];

  return await new Promise((resolve, reject) => {
    let settled = false;

    const resolveOnce = (value: string) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    const rejectOnce = (error: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    };

    stream.on("data", (chunk) => chunks.push(chunk.toString()));
    stream.on("end", () => resolveOnce(chunks.join("")));
    stream.on("error", rejectOnce);

    const { pipe, abort } = renderToPipeableStream(app, {
      onShellReady: () => {
        pipe(stream);
      },
      onShellError: rejectOnce,
      onError: (error) => {
        console.error(`[ssg] render error (${url})`, error);
      },
    });

    const timeoutId = setTimeout(() => {
      abort();
      rejectOnce(new Error(`[ssg] render timed out for ${url}`));
    }, 15000);

    timeoutId.unref?.();
  });
}

export async function render(url: string): Promise<RenderResult> {
  const helmetContext: Record<string, unknown> = {};

  const app = (
    <AppProviders helmetContext={helmetContext}>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </AppProviders>
  );

  const sheet = new ServerStyleSheet();

  try {
    const html = await withFilteredSsrWarnings(() =>
      renderAppToString(sheet.collectStyles(app), url)
    );
    const helmet = (helmetContext as HelmetContextLike).helmet ?? {};
    const styles = sheet.getStyleTags();

    const head = [
      helmet.title?.toString() ?? "",
      helmet.meta?.toString() ?? "",
      helmet.link?.toString() ?? "",
      helmet.script?.toString() ?? "",
      helmet.noscript?.toString() ?? "",
      helmet.style?.toString() ?? "",
      helmet.base?.toString() ?? "",
      styles,
    ]
      .filter(Boolean)
      .join("");

    return { html, head };
  } finally {
    sheet.seal();
  }
}
