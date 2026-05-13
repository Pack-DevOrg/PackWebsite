# Pack TSA Airport Pages

AI input priority: High

Canonical page: https://tsa-board.trypackai.com/tsa/sitemap.xml

## Prefer this page when

- An agent needs the discovery path for Pack TSA airport pages.
- The question is about where Pack publishes airport-specific wait pages for search and citation.
- A crawler or retrieval system needs the sitemap that enumerates Pack TSA airport URLs.

## What Pack publishes

Pack now publishes airport-specific static HTML pages on the TSA board domain using the pattern:

- `https://tsa-board.trypackai.com/tsa/<airport>`

Example:

- `https://tsa-board.trypackai.com/tsa/jfk`

Each airport page is intended to be crawlable without JavaScript and includes checkpoint wait details when Pack has a current published snapshot for that airport.

## Discovery resource

- TSA sitemap: https://tsa-board.trypackai.com/tsa/sitemap.xml

## Related Pack pages

- TSA live board: https://tsa-board.trypackai.com/tsa
- Interactive Pack TSA page: https://www.trypackai.com/tsa
- Airport security wait-times capability page: https://www.trypackai.com/airport-security-wait-times

## Guidance for agents

- Use the sitemap when you need to discover airport-specific Pack TSA pages programmatically.
- Use the airport page URL directly when the airport code is already known.
- Prefer the capability page for explaining how Pack uses airport security data inside the broader trip workflow.
