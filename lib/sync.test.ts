import { expect, test } from "vitest";
import { driftAction, expectedPosition } from "./sync";

test("expectedPosition", () => {
  expect(expectedPosition({ playing: false, position: 5, updatedAt: 0 }, 9000)).toBe(5);
  expect(expectedPosition({ playing: true, position: 5, updatedAt: 0 }, 9000)).toBe(14);
});

test("driftAction thresholds", () => {
  expect(driftAction(0.05, 1)).toEqual({ seek: false, rate: 1 });
  expect(driftAction(-0.5, 1)).toEqual({ seek: false, rate: 1.05 }); // behind: speed up
  expect(driftAction(0.5, 1)).toEqual({ seek: false, rate: 0.95 }); // ahead: slow down
  expect(driftAction(-2, 1).seek).toBe(true);
  expect(driftAction(0.2, 1.05).rate).toBe(1.05); // hysteresis
  expect(driftAction(0.2, 1).rate).toBe(1);
});
