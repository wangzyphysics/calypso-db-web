import test from "node:test";
import assert from "node:assert/strict";
import { aggregateCountries, countryCode } from "../lib/materials/country-regions.ts";

test("country aggregation uses declared profiles, excludes unknown values and suppresses small public groups", () => {
  assert.equal(countryCode(" China "), "CHN");
  assert.equal(countryCode("中国"), "CHN");
  assert.equal(countryCode("unlisted location"), null);
  assert.equal(countryCode("constructor"), null);
  assert.equal(countryCode("__proto__"), null);
  const result = aggregateCountries(["China", "中国", "CN", "United States", "USA", "", "unknown"]);
  assert.deepEqual(result.regions, [{ countryCode: "CHN", users: 3 }]);
  assert.equal(result.withheld, 2);
  assert.equal(result.unrecognized, 2);
  assert.deepEqual(aggregateCountries(["USA", "China"], 1).regions, [{ countryCode: "CHN", users: 1 }, { countryCode: "USA", users: 1 }]);
});
