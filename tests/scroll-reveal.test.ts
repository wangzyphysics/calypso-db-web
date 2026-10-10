import { test } from "node:test";
import assert from "node:assert/strict";
import { revealProgress } from "../lib/materials/scroll-reveal.ts";

test("one viewport of fully visible content stays clear, including titles and bottom actions", () => {
  for (const viewportBottom of [696, 1000]) {
    for (const step of [0, 3]) {
      for (const [top, bottom] of [
        [80, 125],
        [140, 400],
        [viewportBottom - 60, viewportBottom - 5],
      ]) {
        assert.equal(
          revealProgress({ top, bottom, viewportTop: 78, viewportBottom, step })
            .opacity,
          1,
        );
      }
    }
  }
});
test("only content entering and leaving the viewport edges transitions", () => {
  const viewport = { viewportTop: 78, viewportBottom: 1000 };
  const entering = revealProgress({ ...viewport, top: 955, bottom: 1200 });
  assert.ok(entering.opacity > 0 && entering.opacity < 1);
  assert.equal(
    revealProgress({ ...viewport, top: 780, bottom: 1150 }).opacity,
    1,
  );
  const widerEntrance = revealProgress({ ...viewport, top: 850, bottom: 1150 });
  assert.ok(
    widerEntrance.opacity > entering.opacity && widerEntrance.opacity < 1,
  );
  const leaving = revealProgress({ ...viewport, top: -100, bottom: 100 });
  assert.ok(leaving.opacity > 0 && leaving.opacity < 1);
  assert.equal(
    revealProgress({ ...viewport, top: -100, bottom: 70 }).opacity,
    0,
  );
  assert.equal(
    revealProgress({ ...viewport, top: 1010, bottom: 1200 }).opacity,
    0,
  );
  assert.equal(
    revealProgress({ ...viewport, top: -500, bottom: 1500 }).opacity,
    1,
  );
});
