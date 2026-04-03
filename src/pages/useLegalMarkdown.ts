import {useQuery} from '@tanstack/react-query';

type LoadState = 'loading' | 'loaded' | 'error';

const LEGAL_MARKDOWN_CACHE_VERSION = '2026-03-26';

export function stripLeadingMarkdownH1(markdown: string): string {
  if (!markdown) {
    return markdown;
  }

  const normalized = markdown.replace(/\r\n/g, '\n');
  const headingMatch = normalized.match(/^\s*#\s+.*\n+/);
  if (!headingMatch) {
    return markdown;
  }

  return normalized.slice(headingMatch[0].length).trimStart();
}

export function stripLeadingPlainTitle(text: string, title: string): string {
  if (!text) {
    return text;
  }

  const normalized = text.replace(/\r\n/g, '\n');
  const titlePattern = new RegExp(
    `^\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n+`,
  );
  if (!titlePattern.test(normalized)) {
    return text;
  }

  return normalized.replace(titlePattern, '').trimStart();
}

interface UseLegalMarkdownOptions {
  url: string;
  timeoutMs?: number;
  fallbackContent?: string;
}

interface UseLegalMarkdownResult {
  content: string;
  state: LoadState;
  isShowingCachedContent: boolean;
}

function getStorageKey(url: string): string {
  return `doneai:legal-markdown:${LEGAL_MARKDOWN_CACHE_VERSION}:${url}`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function readStoredText(url: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(getStorageKey(url));
  } catch {
    return null;
  }
}

function writeStoredText(url: string, content: string): void {
  if (typeof window === 'undefined' || !content) {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(url), content);
  } catch {
    // Ignore quota/storage access failures. Legal pages still have bundled fallbacks.
  }
}

async function readCachedText(url: string): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!('caches' in window)) {
    return readStoredText(url);
  }

  try {
    const response = await caches.match(url);
    if (!response || !response.ok) {
      return readStoredText(url);
    }
    return await response.text();
  } catch {
    return readStoredText(url);
  }
}

async function fetchTextWithRetry(
  url: string,
  timeoutMs: number,
  signal: AbortSignal,
): Promise<string> {
  // Keep retries fast: legal pages should render quickly, and we can fall back to
  // cached content or an error message if the network is flaky.
  const attemptDelaysMs = [0, 100, 250];
  let lastError: unknown = null;

  for (const delayMs of attemptDelaysMs) {
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    if (delayMs > 0) {
      await sleep(delayMs);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Link the outer signal (React cleanup) with the per-attempt controller.
    const abortListener = () => controller.abort();
    signal.addEventListener('abort', abortListener, {once: true});

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        // Avoid browser HTTP cache pinning stale legal copy after policy updates.
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
      signal.removeEventListener('abort', abortListener);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to load');
}

export function useLegalMarkdown({
  url,
  timeoutMs = 8000,
  fallbackContent = '',
}: UseLegalMarkdownOptions): UseLegalMarkdownResult {
  const hasFallbackContent = Boolean(fallbackContent);
  const query = useQuery({
    queryKey: ['legal-markdown', url, timeoutMs],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<UseLegalMarkdownResult> => {
      const outerController = new AbortController();
      const cachedContent = await readCachedText(url);

      try {
        const text = await fetchTextWithRetry(
          url,
          timeoutMs,
          outerController.signal,
        );
        writeStoredText(url, text);
        return {
          content: text,
          state: 'loaded',
          isShowingCachedContent: false,
        };
      } catch {
        if (cachedContent) {
          return {
            content: cachedContent,
            state: 'loaded',
            isShowingCachedContent: true,
          };
        }

        if (hasFallbackContent) {
          return {
            content: fallbackContent,
            state: 'loaded',
            isShowingCachedContent: true,
          };
        }

        throw new Error(`Failed to load legal markdown for ${url}`);
      } finally {
        outerController.abort();
      }
    },
    placeholderData: previousData => {
      if (previousData) {
        return previousData;
      }
      if (!hasFallbackContent) {
        return undefined;
      }
      return {
        content: fallbackContent,
        state: 'loaded',
        isShowingCachedContent: true,
      };
    },
  });

  if (query.isError) {
    return {
      content: fallbackContent,
      state: 'error',
      isShowingCachedContent: false,
    };
  }

  const data = query.data;
  if (data) {
    return data;
  }

  return {
    content: fallbackContent,
    state: hasFallbackContent ? 'loaded' : 'loading',
    isShowingCachedContent: hasFallbackContent,
  };
}
