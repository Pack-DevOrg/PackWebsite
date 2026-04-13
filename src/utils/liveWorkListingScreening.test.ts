import {
  DEFAULT_LISTING_FILTERS,
  buildZoneMatch,
  groupListingsByAddress,
  parseListingImportText,
  screenListingGroups,
} from './liveWorkListingScreening';

describe('liveWorkListingScreening', () => {
  it('parses delimited listing text with a fallback source', () => {
    const parsed = parseListingImportText(
      [
        'address,sqft,beds,baths,title,description,price,photo,url',
        '"1315 Innes Pl, Venice, CA 90291",2200,2,2,"Creative loft","Separate office and primary suite with ensuite","$9,500/mo","https://images.example.com/1315.jpg","https://www.zillow.com/homedetails/example"',
      ].join('\n'),
      'zillow',
    );

    expect(parsed.warnings).toEqual([]);
    expect(parsed.listings).toHaveLength(1);
    expect(parsed.listings[0]?.source).toBe('zillow');
    expect(parsed.listings[0]?.squareFeet).toBe(2200);
    expect(parsed.listings[0]?.photoUrl).toBe('https://images.example.com/1315.jpg');
  });

  it('groups source rows by normalized address and derives live/work signals', () => {
    const zillowRows = parseListingImportText(
      [
        'address,sqft,beds,baths,title,description,price,photo,url',
        '"1315 Innes Pl, Venice, CA 90291",2200,2,2,"Live/work loft","Separate office and upstairs primary suite with ensuite","$9,500/mo","https://images.example.com/1315.jpg","https://www.zillow.com/homedetails/example"',
      ].join('\n'),
      'zillow',
    );
    const redfinRows = parseListingImportText(
      [
        'address\tsqft\tbeds\tbaths\tdescription\turl',
        '1315 S Innes Place, Venice, CA 90291\t2100\t2\t2\tCreative live/work with private suite and workspace\thttps://www.redfin.com/example',
      ].join('\n'),
      'redfin',
    );

    const grouped = groupListingsByAddress([
      ...zillowRows.listings,
      ...redfinRows.listings,
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.hasZillow).toBe(true);
    expect(grouped[0]?.hasSupportingSource).toBe(true);
    expect(grouped[0]?.mentionsWorkspace).toBe(true);
    expect(grouped[0]?.likelySeparateBedroomSuite).toBe(true);
    expect(grouped[0]?.primaryPriceText).toBe('$9,500/mo');
    expect(grouped[0]?.primaryPhotoUrl).toBe('https://images.example.com/1315.jpg');
  });

  it('screens grouped listings against zoning and private-suite filters', () => {
    const parsed = parseListingImportText(
      [
        'address,sqft,beds,baths,title,description,price,photo,url',
        '"1315 Innes Pl, Venice, CA 90291",2200,2,2,"Live/work loft","Separate office and upstairs primary suite with ensuite","$9,500/mo","https://images.example.com/1315.jpg","https://www.zillow.com/homedetails/example"',
      ].join('\n'),
      'zillow',
    );
    const grouped = groupListingsByAddress(parsed.listings);
    const zoneMatches = new Map([
      [
        grouped[0]!.normalizedAddress,
        {
          geocodedAddress: '1315 S Innes Pl, Venice, CA 90291',
          latitude: 33.98,
          longitude: -118.47,
          zoneMatch: buildZoneMatch('C4-1', 'Commercial'),
        },
      ],
    ]);

    const screened = screenListingGroups(
      grouped,
      {
        ...DEFAULT_LISTING_FILTERS,
        requireSupportingSource: false,
      },
      zoneMatches,
    );

    expect(screened[0]?.matchesFilters).toBe(true);
    expect(screened[0]?.reasons).toEqual(
      expect.arrayContaining([
        '2,200 sqft',
        'has Zillow listing',
      ]),
    );
  });
});
