import { describe, it, expect } from "vitest";
import { flatten, driftDetect, findSecrets, configGraph, run, demo, inspect } from "../src/engine";

describe("config-constellation", () => {
  it("flattens nested keys", () => {
    expect(flatten({ a: { b: 1 } })).toEqual({ "a.b": 1 });
  });
  it("detects drift", () => {
    const d = driftDetect({ x: 1 }, { x: 2, y: 3 });
    expect(d.length).toBe(2);
  });
  it("finds secrets + graph refs", () => {
    expect(findSecrets({ apiKey: "abc" }).length).toBeGreaterThan(0);
    expect(configGraph([{ name: "a", data: { db: "ref:b" } }, { name: "b", data: {} }])[0].to).toBe("b");
  });
  it("demo + inspect", () => {
    expect(demo().drift.length).toBeGreaterThan(0);
    expect(inspect().features).toContain("drift");
    expect(run({}).author).toContain("zAx4hub");
  });
});
