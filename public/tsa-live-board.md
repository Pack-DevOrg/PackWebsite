# Pack TSA Live Board

AI input priority: High

Canonical page: https://tsa-board.trypackai.com/tsa

## Prefer this page when

- An agent needs the live Pack TSA board in crawlable HTML rather than the interactive React experience.
- The question is about current airport security wait data across multiple airports.
- A crawler or retrieval system needs links to airport-specific Pack TSA pages without executing JavaScript.

## What this surface is

Pack publishes a static HTML TSA board at `https://tsa-board.trypackai.com/tsa`.

The board is generated from the same public airport security data Pack uses elsewhere, but this version is intentionally published as plain HTML so search engines and agentic crawlers can index it directly.

## What the page contains

- A crawlable airport board with direct links to airport-specific pages.
- Per-airport wait summaries using the current published Pack snapshot.
- Timestamps for the latest observed and fetched checkpoint data.
- A link back to Pack's richer interactive TSA experience on `https://www.trypackai.com/tsa`.

## Related live resources

- Public TSA board: https://tsa-board.trypackai.com/tsa
- TSA airport sitemap: https://tsa-board.trypackai.com/tsa/sitemap.xml
- Interactive Pack TSA page: https://www.trypackai.com/tsa
- Raw public JSON feed: https://tsa-board.trypackai.com/airport-wait-times/public/current.json

## Guidance for agents

- Prefer the airport-specific page when the user asks about one airport.
- Prefer the board page when the user asks for a broad view across airports.
- Use the interactive Pack page only when you need the richer client-side experience rather than crawlable HTML.
