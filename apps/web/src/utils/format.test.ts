import { describe, expect, it } from "vitest";
import {
  formatChange,
  formatDay,
  formatDollars,
  formatPercent,
  formatPoints,
  formatThousands,
  formatTimestamp,
  NO_DATA,
} from "./format";

describe("formatChange", () => {
  it("signs a relative change with a true minus", () => {
    expect(formatChange(100, 75.9)).toBe("−24.1%");
    expect(formatChange(100, 103.7)).toBe("+3.7%");
  });

  it("leaves a change that rounds to nothing unsigned", () => {
    expect(formatChange(100, 100.01)).toBe("0.0%");
  });

  it("stands in for a missing side", () => {
    expect(formatChange(null, 1)).toBe(NO_DATA);
    expect(formatChange(1, undefined)).toBe(NO_DATA);
  });
});

describe("formatPoints", () => {
  it("is the difference of two percentages", () => {
    expect(formatPoints(40, 43.7)).toBe("+3.7 pts");
    expect(formatPoints(43.7, 40, 2)).toBe("−3.70 pts");
  });

  it("stands in for a missing side", () => {
    expect(formatPoints(undefined, 1)).toBe(NO_DATA);
  });
});

describe("the plain figures", () => {
  it("formats a percentage and a price", () => {
    expect(formatPercent(12.345)).toBe("12.3%");
    expect(formatPercent(12.345, 0)).toBe("12%");
    expect(formatDollars(3.5)).toBe("$3.50");
    expect(formatPercent(null)).toBe(NO_DATA);
    expect(formatDollars(undefined)).toBe(NO_DATA);
  });

  it("reads thousands of tokens as k below a million and M above", () => {
    expect(formatThousands(412.4)).toBe("412k");
    expect(formatThousands(7270)).toBe("7.27M");
    expect(formatThousands(null)).toBe(NO_DATA);
  });
});

describe("the dates", () => {
  it("names the UTC day of a timestamp", () => {
    expect(formatDay("2026-10-07T23:59:00-02:00")).toBe("8 Oct 2026");
  });

  it("says when a set of figures was gathered, to the minute in UTC", () => {
    expect(formatTimestamp("2026-10-07T00:37:12Z")).toBe(
      "7 Oct 2026, 00:37 UTC",
    );
  });
});
