import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { writeFixture } from "./fixture.ts";
import {
  buildSidebar,
  docsDir,
  groupLabel,
  listPages,
  loadSite,
  readPin,
} from "./site.ts";

const root = writeFixture();
const docs = path.join(root, "docs");
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("readPin", () => {
  const write = (text: string) => {
    const file = path.join(root, "pin.json");
    writeFileSync(file, text);
    return file;
  };

  it("reads the version and the repository", () => {
    expect(
      readPin(write('{ "version": "0.7.1", "repository": "https://x/gg" }')),
    ).toEqual({ version: "0.7.1", repository: "https://x/gg" });
  });

  it("refuses a pin that is not a version", () => {
    expect(() =>
      readPin(write('{ "version": "v0.7", "repository": "https://x/gg" }')),
    ).toThrow(/"version"/);
    expect(() => readPin(write('{ "version": "0.7.1" }'))).toThrow(
      /"repository"/,
    );
  });

  it("is the site's own pin", () => {
    const pin = readPin(path.resolve(__dirname, "../../gg-docs.json"));
    expect(pin.repository).toBe("https://github.com/TheClockwyrks/gg.git");
  });
});

describe("docsDir", () => {
  it("is the fetched version's folder by default", () => {
    expect(docsDir("/repo", "0.7.1", undefined)).toBe(
      "/repo/apps/web/.gg-docs/v0.7.1/docs",
    );
  });

  it("is GG_DOCS_DIR, relative to the repository's root", () => {
    expect(docsDir("/super/gg.rocks", "0.7.1", "../gg/docs")).toBe(
      "/super/gg/docs",
    );
    expect(docsDir("/repo", "0.7.1", "/abs/docs")).toBe("/abs/docs");
  });
});

describe("listPages", () => {
  it("lists every Markdown page, folders included, and nothing else", () => {
    expect(listPages(docs)).toEqual([
      "agents.md",
      "compaction.md",
      "languages/c.md",
      "languages/rust.md",
      "overview.md",
      "responses-as-code/invariants.md",
      "responses-as-code/overview.md",
    ]);
  });

  it("says how to get the pages when the folder is missing", () => {
    expect(() => listPages(path.join(root, "nowhere"))).toThrow(
      /scripts\/gg-docs\.sh.*GG_DOCS_DIR/,
    );
  });

  it("refuses a folder with no pages", () => {
    const empty = path.join(root, "empty");
    mkdirSync(empty);
    expect(() => listPages(empty)).toThrow(/holds no pages/);
  });
});

describe("groupLabel", () => {
  it("is the folder's name in sentence case", () => {
    expect(groupLabel("responses-as-code")).toBe("Responses as code");
    expect(groupLabel("telemetry")).toBe("Telemetry");
  });
});

describe("buildSidebar", () => {
  it("puts the overview first, then pages by title, then folders", () => {
    const site = loadSite(docs, "0.7.1");
    expect(site.sidebar).toEqual([
      { kind: "link", label: "Overview", slug: "overview" },
      { kind: "link", label: "Agents", slug: "agents" },
      { kind: "link", label: "Compaction", slug: "compaction" },
      {
        kind: "group",
        label: "Languages",
        items: [
          { kind: "link", label: "C", slug: "languages/c" },
          { kind: "link", label: "Rust", slug: "languages/rust" },
        ],
      },
      {
        kind: "group",
        label: "Responses as code",
        items: [
          {
            kind: "link",
            label: "Overview",
            slug: "responses-as-code/overview",
          },
          {
            kind: "link",
            label: "Invariants",
            slug: "responses-as-code/invariants",
          },
        ],
      },
    ]);
  });

  it("nests a folder inside a folder", () => {
    expect(
      buildSidebar([
        { slug: "a/b/page", title: "Page" },
        { slug: "a/top", title: "Top" },
      ]),
    ).toEqual([
      {
        kind: "group",
        label: "A",
        items: [
          { kind: "link", label: "Top", slug: "a/top" },
          {
            kind: "group",
            label: "B",
            items: [{ kind: "link", label: "Page", slug: "a/b/page" }],
          },
        ],
      },
    ]);
  });
});

describe("loadSite", () => {
  it("renders every page with its title and the version", () => {
    const site = loadSite(docs, "0.7.1");
    expect(site.version).toBe("0.7.1");
    expect(site.pages.map((page) => page.slug)).toContain("languages/rust");
    const overview = site.pages.find((page) => page.slug === "overview");
    expect(overview?.html).toContain('<a href="/docs/agents/">agents</a>');
  });
});
