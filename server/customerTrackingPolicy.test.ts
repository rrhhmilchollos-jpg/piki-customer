import assert from "node:assert/strict";
import test from "node:test";

type Stage = "confirmed" | "preparing" | "onway";
const stableStage = (previous: Stage, next: Stage): Stage => {
  const rank: Record<Stage, number> = { confirmed: 0, preparing: 1, onway: 2 };
  return rank[next] < rank[previous] ? previous : next;
};

test("una respuesta antigua no hace retroceder la tarjeta lista para recoger", () => {
  assert.equal(stableStage("preparing", "confirmed"), "preparing");
  assert.equal(stableStage("onway", "preparing"), "onway");
  assert.equal(stableStage("confirmed", "preparing"), "preparing");
});
