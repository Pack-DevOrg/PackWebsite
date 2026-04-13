/**
 * @fileoverview Listing import, matching, and screening helpers for the West LA live/work tool.
 */

import {z} from 'zod';
import {
  classifyLiveWorkCategory,
  extractBaseZone,
  getLiveWorkCategoryLabel,
  type LiveWorkCategory,
} from './westLaLiveWorkZoning';

const LISTING_SOURCE_VALUES = [
  'zillow',
  'redfin',
  'realtor',
  'homes',
  'loopnet',
  'apartments',
  'other',
] as const;

const LISTING_SOURCE_LABELS: Record<ListingSource, string> = {
  zillow: 'Zillow',
  redfin: 'Redfin',
  realtor: 'Realtor.com',
  homes: 'Homes.com',
  loopnet: 'LoopNet',
  apartments: 'Apartments.com',
  other: 'Other',
};

const LISTING_SOURCE_KEYWORDS: Array<[string, ListingSource]> = [
  ['zillow', 'zillow'],
  ['redfin', 'redfin'],
  ['realtor', 'realtor'],
  ['realtor.com', 'realtor'],
  ['homes.com', 'homes'],
  ['homes', 'homes'],
  ['loopnet', 'loopnet'],
  ['apartments.com', 'apartments'],
];

const ROW_HEADER_ALIASES: Record<string, string> = {
  source: 'source',
  site: 'source',
  provider: 'source',
  url: 'url',
  link: 'url',
  address: 'address',
  location: 'address',
  streetaddress: 'address',
  sqft: 'squareFeet',
  squarefeet: 'squareFeet',
  squarefootage: 'squareFeet',
  square_ft: 'squareFeet',
  livingarea: 'squareFeet',
  beds: 'bedrooms',
  bedrooms: 'bedrooms',
  bd: 'bedrooms',
  baths: 'bathrooms',
  bathrooms: 'bathrooms',
  ba: 'bathrooms',
  title: 'title',
  headline: 'title',
  description: 'description',
  details: 'description',
  remarks: 'description',
  notes: 'notes',
  price: 'price',
  rent: 'price',
  photo: 'photoUrl',
  image: 'photoUrl',
  imageurl: 'photoUrl',
  photourl: 'photoUrl',
  thumbnail: 'photoUrl',
};

const WORKSPACE_PATTERNS = [
  /\boffice\b/i,
  /\bworkspace\b/i,
  /\bstudio\b/i,
  /\bloft\b/i,
  /\bflex\b/i,
  /\bcreative\b/i,
  /\blive\/work\b/i,
  /\blive-work\b/i,
  /\bwork\s+loft\b/i,
  /\bseparate\s+office\b/i,
  /\bden\b/i,
];

const ENSUITE_PATTERNS = [
  /\bensuite\b/i,
  /\ben-suite\b/i,
  /\battached bath\b/i,
  /\bprimary bath\b/i,
  /\bprimary suite\b/i,
  /\bmaster suite\b/i,
  /\bprivate bath\b/i,
];

const SEPARATE_SUITE_PATTERNS = [
  /\bguest suite\b/i,
  /\bprivate suite\b/i,
  /\bseparate bedroom\b/i,
  /\bdownstairs bedroom\b/i,
  /\bground floor bedroom\b/i,
  /\bfirst floor bedroom\b/i,
  /\bthird floor bedroom\b/i,
  /\bsecond bedroom\b/i,
  /\bdual primary\b/i,
];

const ACTIVE_LISTING_PATTERNS = [
  /\bavailable today\b/i,
  /\bsource listing status:\s*active\b/i,
  /\bactive (?:zillow|rental|listing)\b/i,
  /\bfor rent\b/i,
  /\bcurrently active\b/i,
];

const STALE_LISTING_PATTERNS = [
  /\bnot active inventory\b/i,
  /\bolder comp\b/i,
  /\bhistoric\b/i,
  /\boff market\b/i,
  /\bformer listing\b/i,
];

const ListingSourceSchema = z.enum(LISTING_SOURCE_VALUES);

const ImportedListingSchema = z.object({
  id: z.string().min(1),
  source: ListingSourceSchema,
  sourceLabel: z.string().min(1),
  address: z.string().min(1),
  normalizedAddress: z.string().min(1),
  url: z.string().url().nullable(),
  squareFeet: z.number().positive().nullable(),
  bedrooms: z.number().positive().nullable(),
  bathrooms: z.number().positive().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  notes: z.string().nullable(),
  priceText: z.string().nullable(),
  photoUrl: z.string().url().nullable(),
  rawText: z.string().min(1),
});

const ListingImportResultSchema = z.object({
  listings: z.array(ImportedListingSchema),
  warnings: z.array(z.string()),
});

const ListingGroupSchema = z.object({
  id: z.string().min(1),
  normalizedAddress: z.string().min(1),
  displayAddress: z.string().min(1),
  sources: z.array(ListingSourceSchema).min(1),
  sourceLabels: z.array(z.string()).min(1),
  sourceUrls: z.record(z.string(), z.string().url()).default({}),
  sourceCount: z.number().int().positive(),
  zillowUrl: z.string().url().nullable(),
  hasZillow: z.boolean(),
  hasSupportingSource: z.boolean(),
  primaryPriceText: z.string().nullable(),
  primaryPriceValue: z.number().positive().nullable(),
  primaryPhotoUrl: z.string().url().nullable(),
  maxSquareFeet: z.number().positive().nullable(),
  bedrooms: z.number().positive().nullable(),
  bathrooms: z.number().positive().nullable(),
  combinedText: z.string(),
  mentionsWorkspace: z.boolean(),
  mentionsEnsuite: z.boolean(),
  mentionsSeparateSuite: z.boolean(),
  likelySeparateBedroomSuite: z.boolean(),
  likelyCurrentListing: z.boolean(),
  sourceListings: z.array(ImportedListingSchema).min(1),
});

export type ListingSource = z.infer<typeof ListingSourceSchema>;
export type ImportedListing = z.infer<typeof ImportedListingSchema>;
export type ListingImportResult = z.infer<typeof ListingImportResultSchema>;
export type ListingGroup = z.infer<typeof ListingGroupSchema>;

export type ListingZoneMatch = {
  readonly zoneComplete: string | null;
  readonly zoneBase: string | null;
  readonly zoneDescription: string | null;
  readonly category: LiveWorkCategory | null;
};

export type ScreenedListingGroup = ListingGroup & {
  readonly geocodedAddress: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly zoneMatch: ListingZoneMatch | null;
  readonly reasons: readonly string[];
  readonly blockers: readonly string[];
  readonly matchesFilters: boolean;
  readonly fitScore: number;
  readonly fitLabel: 'strong' | 'possible' | 'weak';
};

export type ListingScreenFilters = {
  readonly minSquareFeet: number;
  readonly maxPrice: number;
  readonly requireZillow: boolean;
  readonly requireSupportingSource: boolean;
  readonly requireCandidateZone: boolean;
  readonly requireWorkspaceSignal: boolean;
  readonly requirePrivateSuiteSignal: boolean;
  readonly requireCurrentListingSignal: boolean;
};

type ImportedRowShape = {
  readonly source?: string;
  readonly url?: string;
  readonly address?: string;
  readonly squareFeet?: string;
  readonly bedrooms?: string;
  readonly bathrooms?: string;
  readonly title?: string;
  readonly description?: string;
  readonly notes?: string;
  readonly price?: string;
  readonly photoUrl?: string;
};

export const DEFAULT_LISTING_FILTERS: ListingScreenFilters = {
  minSquareFeet: 1500,
  maxPrice: 20000,
  requireZillow: true,
  requireSupportingSource: true,
  requireCandidateZone: true,
  requireWorkspaceSignal: true,
  requirePrivateSuiteSignal: true,
  requireCurrentListingSignal: true,
};

export function getListingSourceLabel(source: ListingSource): string {
  return LISTING_SOURCE_LABELS[source];
}

export function inferListingSource(
  input: string | null | undefined,
  fallbackSource: ListingSource,
): ListingSource {
  const normalizedInput = input?.trim().toLowerCase();

  if (!normalizedInput) {
    return fallbackSource;
  }

  for (const [keyword, source] of LISTING_SOURCE_KEYWORDS) {
    if (normalizedInput.includes(keyword)) {
      return source;
    }
  }

  return fallbackSource;
}

export function normalizeListingAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/\b(north|south|east|west|n|s|e|w)\b/g, '')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\broadway\b/g, 'broadway')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function parsePositiveNumber(input: string | null | undefined): number | null {
  if (!input) {
    return null;
  }

  const normalized = input.replace(/[^0-9.]/g, '');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function inferLikelyCurrentListing(rawText: string): boolean {
  if (STALE_LISTING_PATTERNS.some((pattern) => pattern.test(rawText))) {
    return false;
  }

  return ACTIVE_LISTING_PATTERNS.some((pattern) => pattern.test(rawText));
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let isQuoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter = line[index + 1];
      if (isQuoted && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
        continue;
      }

      isQuoted = !isQuoted;
      continue;
    }

    if (character === delimiter && !isQuoted) {
      values.push(currentValue.trim());
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue.trim());
  return values;
}

function inferDelimiter(headerLine: string): string {
  if (headerLine.includes('\t')) {
    return '\t';
  }

  if (headerLine.includes('|')) {
    return '|';
  }

  return ',';
}

function canonicalizeHeader(header: string): string {
  const normalizedHeader = header.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return ROW_HEADER_ALIASES[normalizedHeader] ?? normalizedHeader;
}

function parseRowsFromDelimitedText(rawText: string): ImportedRowShape[] {
  const trimmedText = rawText.trim();
  if (!trimmedText) {
    return [];
  }

  const lines = trimmedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const delimiter = inferDelimiter(lines[0]);
  const headers = parseDelimitedLine(lines[0], delimiter).map(canonicalizeHeader);

  return lines.slice(1).map((line) => {
    const values = parseDelimitedLine(line, delimiter);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    return row;
  });
}

function parseRowsFromJson(rawText: string): ImportedRowShape[] {
  const parsed = JSON.parse(rawText) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('JSON import must be an array of listing rows');
  }

  return parsed.map((value) => {
    if (!value || typeof value !== 'object') {
      throw new Error('Every JSON listing row must be an object');
    }

    const row = value as Record<string, unknown>;
    const normalizedRow: Record<string, string> = {};
    Object.entries(row).forEach(([key, rawValue]) => {
      normalizedRow[canonicalizeHeader(key)] =
        rawValue == null ? '' : String(rawValue);
    });

    return normalizedRow;
  });
}

function parseImportedRows(rawText: string): ImportedRowShape[] {
  const trimmedText = rawText.trim();

  if (!trimmedText) {
    return [];
  }

  if (trimmedText.startsWith('[')) {
    return parseRowsFromJson(trimmedText);
  }

  return parseRowsFromDelimitedText(trimmedText);
}

function buildImportedListing(
  row: ImportedRowShape,
  index: number,
  fallbackSource: ListingSource,
): ImportedListing | null {
  const address = row.address?.trim();
  if (!address) {
    return null;
  }

  const source = inferListingSource(
    row.source || row.url || row.notes || row.title,
    fallbackSource,
  );
  const normalizedAddress = normalizeListingAddress(address);
  const description = row.description?.trim() || null;
  const title = row.title?.trim() || null;
  const notes = row.notes?.trim() || null;
  const priceText = row.price?.trim() || null;
  const photoUrl = row.photoUrl?.trim() || null;
  const url = row.url?.trim() || null;
  const rawText = [title, description, notes, priceText, address]
    .filter(Boolean)
    .join(' ');

  return ImportedListingSchema.parse({
    id: `${source}-${normalizedAddress}-${index}`,
    source,
    sourceLabel: getListingSourceLabel(source),
    address,
    normalizedAddress,
    url: url || null,
    squareFeet: parsePositiveNumber(row.squareFeet),
    bedrooms: parsePositiveNumber(row.bedrooms),
    bathrooms: parsePositiveNumber(row.bathrooms),
    title,
    description,
    notes,
    priceText,
    photoUrl,
    rawText,
  });
}

export function parseListingImportText(
  rawText: string,
  fallbackSource: ListingSource,
): ListingImportResult {
  const importedRows = parseImportedRows(rawText);
  const warnings: string[] = [];
  const listings: ImportedListing[] = [];

  importedRows.forEach((row, index) => {
    const listing = buildImportedListing(row, index, fallbackSource);
    if (!listing) {
      warnings.push(`Skipped row ${index + 2} because it did not include an address.`);
      return;
    }

    listings.push(listing);
  });

  return ListingImportResultSchema.parse({
    listings,
    warnings,
  });
}

function choosePreferredAddress(listings: readonly ImportedListing[]): string {
  const zillowListing = listings.find((listing) => listing.source === 'zillow');
  return zillowListing?.address ?? listings[0]?.address ?? 'Unknown address';
}

function choosePreferredValue<T>(
  listings: readonly ImportedListing[],
  selector: (listing: ImportedListing) => T | null,
): T | null {
  const zillowListing = listings.find((listing) => listing.source === 'zillow');
  const zillowValue = zillowListing ? selector(zillowListing) : null;

  if (zillowValue) {
    return zillowValue;
  }

  for (const listing of listings) {
    const value = selector(listing);
    if (value) {
      return value;
    }
  }

  return null;
}

function getBestNumber(
  listings: readonly ImportedListing[],
  field: 'squareFeet' | 'bedrooms' | 'bathrooms',
): number | null {
  const values = listings
    .map((listing) => listing[field])
    .filter((value): value is number => typeof value === 'number');

  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

export function groupListingsByAddress(
  listings: readonly ImportedListing[],
): ListingGroup[] {
  const listingsByAddress = new Map<string, ImportedListing[]>();

  listings.forEach((listing) => {
    const existingListings = listingsByAddress.get(listing.normalizedAddress) ?? [];
    existingListings.push(listing);
    listingsByAddress.set(listing.normalizedAddress, existingListings);
  });

  return [...listingsByAddress.entries()]
    .map(([normalizedAddress, groupedListings]) => {
      const dedupedSources = [...new Set(groupedListings.map((listing) => listing.source))];
      const sourceUrls = Object.fromEntries(
        groupedListings
          .filter((listing) => listing.url)
          .map((listing) => [listing.source, listing.url as string]),
      );
      const combinedText = groupedListings
        .map((listing) => listing.rawText)
        .join(' ');
      const bedrooms = getBestNumber(groupedListings, 'bedrooms');
      const bathrooms = getBestNumber(groupedListings, 'bathrooms');
      const mentionsWorkspace = WORKSPACE_PATTERNS.some((pattern) =>
        pattern.test(combinedText));
      const mentionsEnsuite = ENSUITE_PATTERNS.some((pattern) =>
        pattern.test(combinedText));
      const mentionsSeparateSuite = SEPARATE_SUITE_PATTERNS.some((pattern) =>
        pattern.test(combinedText));
      const likelySeparateBedroomSuite =
        (bedrooms != null && bedrooms >= 2 && mentionsEnsuite) ||
        (mentionsEnsuite && mentionsSeparateSuite);

      return ListingGroupSchema.parse({
        id: normalizedAddress,
        normalizedAddress,
        displayAddress: choosePreferredAddress(groupedListings),
        sources: dedupedSources,
        sourceLabels: dedupedSources.map(getListingSourceLabel),
        sourceUrls,
        sourceCount: dedupedSources.length,
        zillowUrl: sourceUrls.zillow ?? null,
        hasZillow: dedupedSources.includes('zillow'),
        hasSupportingSource: dedupedSources.some((source) => source !== 'zillow'),
        primaryPriceText: choosePreferredValue(
          groupedListings,
          (listing) => listing.priceText,
        ),
        primaryPriceValue: choosePreferredValue(
          groupedListings,
          (listing) => parsePositiveNumber(listing.priceText),
        ),
        primaryPhotoUrl: choosePreferredValue(
          groupedListings,
          (listing) => listing.photoUrl,
        ),
        maxSquareFeet: getBestNumber(groupedListings, 'squareFeet'),
        bedrooms,
        bathrooms,
        combinedText,
        mentionsWorkspace,
        mentionsEnsuite,
        mentionsSeparateSuite,
        likelySeparateBedroomSuite,
        likelyCurrentListing: inferLikelyCurrentListing(combinedText),
        sourceListings: groupedListings,
      });
    })
    .sort((leftGroup, rightGroup) => {
      const leftSquareFeet = leftGroup.maxSquareFeet ?? 0;
      const rightSquareFeet = rightGroup.maxSquareFeet ?? 0;
      return rightSquareFeet - leftSquareFeet;
    });
}

export function describeZoneMatch(zoneMatch: ListingZoneMatch | null): string {
  if (!zoneMatch?.zoneComplete) {
    return 'No candidate zoning match found in the current overlay.';
  }

  if (!zoneMatch.category) {
    return `${zoneMatch.zoneComplete} matched, but it is not in the current candidate lists.`;
  }

  return `${zoneMatch.zoneComplete} (${getLiveWorkCategoryLabel(zoneMatch.category)})`;
}

export function buildZoneMatch(
  zoneComplete: string | null | undefined,
  zoneDescription: string | null | undefined,
): ListingZoneMatch | null {
  if (!zoneComplete && !zoneDescription) {
    return null;
  }

  const normalizedZoneComplete = zoneComplete ?? null;
  return {
    zoneComplete: normalizedZoneComplete,
    zoneBase: extractBaseZone(normalizedZoneComplete),
    zoneDescription: zoneDescription ?? null,
    category: classifyLiveWorkCategory(normalizedZoneComplete),
  };
}

export function screenListingGroups(
  listingGroups: readonly ListingGroup[],
  filters: ListingScreenFilters,
  zoneMatchesByAddress: ReadonlyMap<string, {
    readonly geocodedAddress: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly zoneMatch: ListingZoneMatch | null;
  }>,
): ScreenedListingGroup[] {
  return listingGroups.map((group) => {
    const locationMatch = zoneMatchesByAddress.get(group.normalizedAddress);
    const reasons: string[] = [];
    const blockers: string[] = [];
    let fitScore = 0;

    if (group.likelyCurrentListing) {
      reasons.push('current listing signal');
      fitScore += 2;
    } else if (filters.requireCurrentListingSignal) {
      blockers.push('no current listing signal');
    }

    if (group.maxSquareFeet != null && group.maxSquareFeet >= filters.minSquareFeet) {
      reasons.push(`${group.maxSquareFeet.toLocaleString()} sqft`);
      fitScore += 2;
    } else {
      blockers.push(`below ${filters.minSquareFeet.toLocaleString()} sqft`);
    }

    if (
      group.primaryPriceValue != null &&
      group.primaryPriceValue <= filters.maxPrice
    ) {
      reasons.push(`under $${filters.maxPrice.toLocaleString()}/mo`);
      fitScore += 2;
    } else if (group.primaryPriceValue != null) {
      blockers.push(`over $${filters.maxPrice.toLocaleString()}/mo`);
    } else {
      blockers.push('missing price');
    }

    if (group.hasZillow) {
      reasons.push('has Zillow listing');
      fitScore += 1;
    } else if (filters.requireZillow) {
      blockers.push('missing Zillow listing');
    }

    if (group.hasSupportingSource) {
      reasons.push(`${group.sourceCount} sources matched`);
      fitScore += 1;
    } else if (filters.requireSupportingSource) {
      blockers.push('missing supporting source');
    }

    if (group.mentionsWorkspace) {
      reasons.push('workspace or office language');
      fitScore += 2;
    } else if (filters.requireWorkspaceSignal) {
      blockers.push('no office/workspace signal');
    }

    if (group.likelySeparateBedroomSuite) {
      reasons.push('private bedroom/ensuite signal');
      fitScore += 2;
    } else if (filters.requirePrivateSuiteSignal) {
      blockers.push('no clear separate bedroom + ensuite signal');
    }

    if (locationMatch?.zoneMatch?.category) {
      reasons.push(describeZoneMatch(locationMatch.zoneMatch));
      fitScore += 2;
    } else if (filters.requireCandidateZone) {
      blockers.push('not in current candidate zoning overlay');
    }

    const fitLabel =
      fitScore >= 10 ? 'strong' : fitScore >= 6 ? 'possible' : 'weak';

    return {
      ...group,
      geocodedAddress: locationMatch?.geocodedAddress ?? null,
      latitude: locationMatch?.latitude ?? null,
      longitude: locationMatch?.longitude ?? null,
      zoneMatch: locationMatch?.zoneMatch ?? null,
      reasons,
      blockers,
      matchesFilters: blockers.length === 0,
      fitScore,
      fitLabel,
    };
  });
}
