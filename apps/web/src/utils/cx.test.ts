import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("joins the class names it is given, skipping the falsy ones", () => {
    expect(cx("a", false, null, "b", undefined, "")).toBe("a b");
  });

  it("is empty when no name is given", () => {
    expect(cx()).toBe("");
  });
});
