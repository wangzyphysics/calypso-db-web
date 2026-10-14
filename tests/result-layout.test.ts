import test from "node:test";
import assert from "node:assert/strict";
import { resultPreferences, resultRange, preferenceParams } from "../lib/materials/result-layout.ts";
test("result summary has explicit ranges and supported page sizes",()=>{
 assert.deepEqual(resultRange(23,2,20),{start:21,end:23,pages:2});
 assert.deepEqual(resultRange(23,3,20),{start:0,end:0,pages:2});
 assert.deepEqual(resultRange(0,1,20),{start:0,end:0,pages:1});
 assert.equal(resultPreferences(new URLSearchParams('pageSize=50&view=cards&grouping=phase&page=2')).pageSize,50);
 assert.equal(resultPreferences(new URLSearchParams('pageSize=999&page=-1')).pageSize,20);
 const preferences=resultPreferences(new URLSearchParams('pageSize=10&grouping=phase&page=2'));
 assert.deepEqual(resultPreferences(preferenceParams(preferences)),preferences);
});
