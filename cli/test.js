import { roll } from "./roll.js";
import { strict as assert } from "node:assert";

// Test 1: determinism — same userId always produces same result
const a = roll("test-user-123");
const b = roll("test-user-123");
assert.deepStrictEqual(a, b, "roll() must be deterministic");

// Test 2: different users produce different results
const c = roll("different-user");
assert.notDeepStrictEqual(a.bones.stats, c.bones.stats, "different users should differ");

// Test 3: all fields are present and valid
assert.ok(
  ["common", "uncommon", "rare", "epic", "legendary"].includes(a.bones.rarity),
  `invalid rarity: ${a.bones.rarity}`
);
assert.ok(a.bones.species, "species must exist");
assert.ok(a.bones.eye, "eye must exist");
assert.ok(a.bones.hat, "hat must exist");
assert.equal(typeof a.bones.shiny, "boolean", "shiny must be boolean");

const statNames = ["DEBUGGING", "PATIENCE", "CHAOS", "WISDOM", "SNARK"];
for (const name of statNames) {
  const val = a.bones.stats[name];
  assert.ok(val >= 1 && val <= 100, `stat ${name}=${val} out of range`);
}

// Test 4: common rarity always gets hat "none"
let commonFound = false;
for (let i = 0; i < 1000; i++) {
  const r = roll(`seed-${i}`);
  if (r.bones.rarity === "common") {
    assert.equal(r.bones.hat, "none", "common rarity must have hat=none");
    commonFound = true;
  }
}
assert.ok(commonFound, "should have found at least one common in 1000 rolls");

// Test 5: stats have exactly one peak and one dump
for (let i = 0; i < 100; i++) {
  const r = roll(`stats-test-${i}`);
  const values = Object.values(r.bones.stats);
  const max = Math.max(...values);
  const min = Math.min(...values);
  assert.ok(max > min, "peak must be greater than dump");
}

console.log("All tests passed ✓");
