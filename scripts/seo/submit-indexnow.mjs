import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const SITE_ORIGIN = 'https://www.trypackai.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const INDEXNOW_KEY = '25d8c860d31245a493bfc567f392b165';
const INDEXNOW_KEY_LOCATION = `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`;
const SITEMAP_PATH = resolve('public', 'sitemap.xml');

const parseSitemapUrls = () => {
  const sitemap = readFileSync(SITEMAP_PATH, 'utf8');
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
};

const parseCliUrls = () => {
  const args = process.argv.slice(2);
  if (args.includes('--sitemap')) {
    return parseSitemapUrls();
  }

  if (args.length === 0) {
    throw new Error(
      'Pass changed URLs to submit, or use --sitemap intentionally for a full sitemap submission.',
    );
  }

  return args;
};

const normalizeUrl = (url) => {
  const parsedUrl = new URL(url);
  if (parsedUrl.origin !== SITE_ORIGIN) {
    throw new Error(`IndexNow URL must belong to ${SITE_ORIGIN}: ${url}`);
  }

  return parsedUrl.href;
};

const submitIndexNowUrls = async (urls) => {
  const uniqueUrls = [...new Set(urls.map(normalizeUrl))];
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      host: new URL(SITE_ORIGIN).hostname,
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList: uniqueUrls,
    }),
  });

  if (!response.ok && response.status !== 202) {
    const responseBody = await response.text();
    throw new Error(
      `IndexNow submission failed with ${response.status}: ${responseBody}`,
    );
  }

  console.log(
    `Submitted ${uniqueUrls.length} URL${uniqueUrls.length === 1 ? '' : 's'} to IndexNow: ${response.status}`,
  );
};

await submitIndexNowUrls(parseCliUrls());
