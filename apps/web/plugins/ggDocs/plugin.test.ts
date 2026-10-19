import { rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { writeFixture } from "./fixture.ts";
import { ggDocs, indexModule, pageModule } from "./plugin.ts";
import { loadSite } from "./site.ts";

const root = writeFixture();
const pinFile = path.join(root, "gg-docs.json");
writeFileSync(
  pinFile,
  '{ "version": "0.7.1", "repository": "https://example.invalid/gg" }',
);
afterAll(() => rmSync(root, { recursive: true, force: true }));

// The hooks as Vite calls them, with `this` reduced to the one method used.
const context = {
  error(message: string): never {
    throw new Error(message);
  },
};
type Hook = (this: typeof context, id: string) => unknown;
const call = (hook: unknown, id: string) => (hook as Hook).call(context, id);

describe("indexModule", () => {
  const source = indexModule(loadSite(path.join(root, "docs"), "0.7.1"));

  it("exports the version and the sidebar", () => {
    expect(source).toContain('export const version = "0.7.1";');
    expect(source).toContain('export const sidebar = [{"kind":"link"');
  });

  it("gives each page a title and a loader of its own chunk", () => {
    expect(source).toContain(
      '"languages/rust": { title: "Rust", load: () => import("virtual:gg-docs/page/languages/rust") },',
    );
  });
});

describe("pageModule", () => {
  const site = loadSite(path.join(root, "docs"), "0.7.1");

  it("exports the rendered page", () => {
    const source = pageModule(site, "agents") ?? "";
    expect(source.startsWith("export default {")).toBe(true);
    expect(source).toContain('"title":"Agents"');
    expect(source).toContain('<h2 id=\\"slots\\">Slots</h2>');
  });

  it("is null for no such page", () => {
    expect(pageModule(site, "missing")).toBeNull();
  });
});

describe("ggDocs", () => {
  const plugin = ggDocs({ repoRoot: root, pinFile, override: "docs" });

  it("claims its own modules alone", () => {
    expect(call(plugin.resolveId, "virtual:gg-docs")).toBe("\0virtual:gg-docs");
    expect(call(plugin.resolveId, "virtual:gg-docs/page/agents")).toBe(
      "\0virtual:gg-docs/page/agents",
    );
    expect(call(plugin.resolveId, "react")).toBeNull();
  });

  it("loads the index and the pages from GG_DOCS_DIR", () => {
    expect(call(plugin.load, "\0virtual:gg-docs")).toContain(
      'export const version = "0.7.1";',
    );
    expect(call(plugin.load, "\0virtual:gg-docs/page/compaction")).toContain(
      '"title":"Compaction"',
    );
    expect(call(plugin.load, "/src/main.tsx")).toBeNull();
  });

  it("fails the build on a page that does not exist", () => {
    expect(() => call(plugin.load, "\0virtual:gg-docs/page/missing")).toThrow(
      "gg docs: no page missing",
    );
  });

  it("names the fetch script when the pinned pages are missing", () => {
    const unfetched = ggDocs({ repoRoot: root, pinFile });
    expect(() => call(unfetched.load, "\0virtual:gg-docs")).toThrow(
      /\.gg-docs\/v0\.7\.1\/docs does not exist; run scripts\/gg-docs\.sh/,
    );
  });
});
