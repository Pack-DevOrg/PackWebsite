import {capabilityPageDefinitions} from "@/content/capabilityPages";

describe("capability page metadata", () => {
  it("keeps rendered page titles under the search result truncation threshold", () => {
    for (const page of capabilityPageDefinitions) {
      expect(`${page.pageTitle} | Pack`.length).toBeLessThanOrEqual(70);
    }
  });
});
