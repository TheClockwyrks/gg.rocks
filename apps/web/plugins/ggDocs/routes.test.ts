import { describe, expect, it } from "vitest";
import { routeFor, slugOf } from "./routes.ts";

describe("routeFor", () => {
  it("serves a page under /docs with a trailing slash", () => {
    expect(routeFor("overview")).toBe("/docs/overview/");
    expect(routeFor("languages/rust")).toBe("/docs/languages/rust/");
  });
});

describe("slugOf", () => {
  it("shows the overview at /docs itself", () => {
    expect(slugOf(undefined)).toBe("overview");
    expect(slugOf("")).toBe("overview");
    expect(slugOf("/")).toBe("overview");
  });

  it("reads a page's slug with or without its trailing slash", () => {
    expect(slugOf("languages/rust/")).toBe("languages/rust");
    expect(slugOf("languages/rust")).toBe("languages/rust");
  });
});
