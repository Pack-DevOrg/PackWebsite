/**
 * @fileoverview Curated active-ish Westside rental shortlist assembled from public listing pages.
 */

export const RESEARCHED_SHORTLIST_DATE_LABEL = 'April 13, 2026';

export const RESEARCHED_PRIMARY_ROWS = [
  'source,address,sqft,beds,baths,title,description,price,url,notes',
  '"Realtor.com","2100 Abbot Kinney Blvd Unit 7, Venice, CA 90291",3269,4,3,"Abbot Kinney live/work loft","Public rental page says Live, work in a rare mixed-use architectural loft. Top-level loft can function as workspace, and the bonus room includes an en-suite bath. Source Listing Status: Active.","$14,985/mo","https://www.realtor.com/rentals/details/2100-Abbot-Kinney-Blvd-Unit-7_Venice_CA_90291_M24527-97214","Current listing source."',
  '"Realtor.com","5831 Seawalk Dr, Playa Vista, CA 90094",2250,2,3,"Playa Vista home with den/office","Public rental page says 2 bedroom and a home office/den or 3rd bedroom. Available today. Primary suite is separate upstairs.","$6,775/mo","https://www.realtor.com/rentals/details/5831-Seawalk-Dr_Playa-Vista_CA_90094_M11544-88826","Current listing source."',
  '"Realtor.com","13650 Marina Pointe Dr Unit 1603, Marina del Rey, CA 90292",1698,2,3,"Marina Pointe condo with den/office","Public rental page explicitly lists a Den/Office. Source page remains for-rent and was updated within the last two weeks.","$9,999/mo","https://www.realtor.com/rentals/details/13650-Marina-Pointe-Dr-Unit-1603_Marina-Del-Rey_CA_90292_M27879-23537","Current listing source."',
  '"Realtor.com","3220 S Barrington Ave, Los Angeles, CA 90066",2070,4,4,"Mar Vista house with current active status","Public rental page still shows Source Listing Status: Active. Large enough to carve out a separate private section, but office/live-work language is weaker.","$10,500/mo","https://www.realtor.com/rentals/details/3220-S-Barrington-Ave_Los-Angeles_CA_90066_M98159-09852","Current listing source."',
  '"Realtor.com","4109 Beethoven St, Los Angeles, CA 90066",2000,4,4,"Mar Vista house with dual suite potential","Current rental listing. Layout-based fit rather than explicit live/work wording, but large enough with multiple baths and primary suite language.","$7,200/mo","https://www.realtor.com/rentals/details/4109-Beethoven-St_Los-Angeles_CA_90066_M14960-04748","Current listing source."',
].join('\n');

export const RESEARCHED_SUPPORTING_ROWS = [
  'source\taddress\tsqft\tbeds\tbaths\tdescription\turl\tnotes',
  'Redfin\t3220 S Barrington Ave, Los Angeles, CA 90066\t2070\t4\t4\tRedfin public page shows Listed for Rent and confirms 2,070 square feet.\thttps://www.redfin.com/CA/Los-Angeles/3220-S-Barrington-Ave-90066/home/194177319\tSupporting current-status page',
  'Zillow\t4109 Beethoven St, Los Angeles, CA 90066\t2000\t4\t4\tZillow public page mirrors the current rental with 2,000 square feet.\thttps://www.zillow.com/homedetails/4109-Beethoven-St-Los-Angeles-CA-90066/20445800_zpid/\tSupporting current-status page',
].join('\n');
