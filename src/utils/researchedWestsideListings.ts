/**
 * @fileoverview Curated Westside live/work rental shortlist assembled from public listing pages.
 */

export const RESEARCHED_SHORTLIST_DATE_LABEL = 'April 13, 2026';

export const RESEARCHED_ZILLOW_ROWS = [
  'address,sqft,beds,baths,title,description,price,url,notes',
  '"933 15th St APT A, Santa Monica, CA 90403",1701,2,3,"2 bed + loft townhome","Active Zillow rental. Loft is explicitly described as ideal for a third bedroom, media room, or home office. Three private outdoor spaces and private 2-car garage. Listed March 31, 2026 and updated within the last day.","$8,995/mo","https://www.zillow.com/homedetails/933-15th-St-APT-A-Santa-Monica-CA-90403/20478261_zpid/","Current Zillow listing."',
  '"30 20th Ave, Venice, CA 90291",,3,2,"Beach walk-street house with separate-entry third suite","Active Zillow rental. Listing says the 3rd bedroom and bathroom can be closed off and used as an office/work area or mother-in-law unit with a separate entrance from the 2 bedroom/bath area.","$8,250/mo","https://www.zillow.com/homedetails/30-20th-Ave-Venice-CA-90291/20443594_zpid/","Current Zillow listing. Zillow omits sqft, so supporting source fills that gap."',
  '"835 Superba Ave, Venice, CA 90291",1914,4,3,"Updated Venice house with primary suite and screening room","Active/recent Zillow rental. 4 bed / 3 bath house with 1,914 sqft, private screening room, and upstairs primary suite with balcony or rooftop deck.","$14,950/mo","https://www.zillow.com/homedetails/835-Superba-Ave-Venice-CA-90291/20452184_zpid/","Current public listing pages still show this as active."',
  '"1919 4th St #B, Santa Monica, CA 90405",1874,3,3,"Ocean Park townhome with loft and roof deck","Older but strong fit. 3 bed / 2.5 bath townhome with a loft leading to a private roof deck and an entrance-level primary suite with ensuite bath. This is not current inventory but it is a good pattern match for the target layout.","$8,995/mo","https://www.zillow.com/homedetails/1919-4th-St-B-Santa-Monica-CA-90405/145642954_zpid/","Recent comp, not active inventory."',
].join('\n');

export const RESEARCHED_SUPPORTING_ROWS = [
  'source\taddress\tsqft\tbeds\tbaths\tdescription\turl\tnotes',
  'Apartments.com\t933 15th St APT A, Santa Monica, CA 90403\t1701\t2\t3\tPrime location at 15th and Montana. 2 BD, 2.5 BA, 2 car private garage, and one extra large loft with view.\thttps://www.apartments.com/933-15th-st-santa-monica-ca/jk1e6w4/\tSupporting rental page',
  'Realtor\t30 20th Ave, Venice, CA 90291\t2000\t3\t2\tRealtor public facts show roughly 2,000 square feet for the address.\thttps://www.realtor.com/realestateandhomes-detail/30-20th-Ave_Venice_CA_90291_M13826-79017\tSupporting size estimate',
  'Compass\t30 20th Ave, Venice, CA 90291\t1884\t3\t2\tCompass historic property detail shows 1,884 square feet and multi-family layout.\thttps://www.compass.com/homedetails/30-20th-Ave-Venice-CA-90291/1IUIQU_pid/\tSupporting size estimate',
  'Homes.com\t835 Superba Ave, Venice, CA 90291\t1914\t4\t3\tHomes.com also shows the listing at 1,914 square feet and repeats the lease description.\thttps://www.homes.com/property/835-superba-ave-venice-ca/44r0wy4vmxp5g/\tSupporting rental page',
  'Homes.com\t1919 4th St #B, Santa Monica, CA 90405\t1874\t3\t3\tHomes.com mirrors the loft to roof-deck description for this Ocean Park townhome.\thttps://www.homes.com/property/1919-4th-st-santa-monica-ca-unit-b/sf2062mcvk5ps/\tSupporting older comp page',
].join('\n');
