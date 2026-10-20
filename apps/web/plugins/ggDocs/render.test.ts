import { describe, expect, it } from "vitest";
import {
  expandAsides,
  renderPage,
  rewriteHref,
  slugFor,
  splitFrontmatter,
} from "./render.ts";

describe("rewriteHref", () => {
  it("moves a link into gg's pages under /docs", () => {
    expect(rewriteHref("/gg/prompts/")).toBe("/docs/prompts/");
    expect(rewriteHref("/gg/responses-as-code/overview/")).toBe(
      "/docs/responses-as-code/overview/",
    );
    expect(rewriteHref("/gg/configurations/#granting-calls")).toBe(
      "/docs/configurations/#granting-calls",
    );
  });

  it("moves the root of gg's pages to /docs/", () => {
    expect(rewriteHref("/gg/")).toBe("/docs/");
    expect(rewriteHref("/gg")).toBe("/docs/");
    expect(rewriteHref("/gg#top")).toBe("/docs/#top");
  });

  it("sends any other root-relative link to docs.testcabinet.ai", () => {
    expect(rewriteHref("/harnesses/overview/")).toBe(
      "https://docs.testcabinet.ai/harnesses/overview/",
    );
    expect(rewriteHref("/components/driver/overview/#runs")).toBe(
      "https://docs.testcabinet.ai/components/driver/overview/#runs",
    );
    // A page whose name only starts with "gg" is not one of gg's pages.
    expect(rewriteHref("/ggx/")).toBe("https://docs.testcabinet.ai/ggx/");
  });

  it("keeps fragments, relative links and full addresses", () => {
    expect(rewriteHref("#model-slots")).toBe("#model-slots");
    expect(rewriteHref("../agents/")).toBe("../agents/");
    expect(rewriteHref("https://example.com/gg/")).toBe(
      "https://example.com/gg/",
    );
    expect(rewriteHref("//example.com/x")).toBe("//example.com/x");
  });
});

describe("slugFor", () => {
  it("drops .md and keeps the folders", () => {
    expect(slugFor("overview.md")).toBe("overview");
    expect(slugFor("languages/rust.md")).toBe("languages/rust");
    expect(slugFor("languages\\rust.md")).toBe("languages/rust");
  });
});

describe("splitFrontmatter", () => {
  it("reads the fields and returns the body after them", () => {
    const { data, body } = splitFrontmatter(
      '---\ntitle: "The sandbox"\n---\n\nBody.\n',
    );
    expect(data).toEqual({ title: "The sandbox" });
    expect(body).toBe("\nBody.\n");
  });

  it("reads Windows line endings", () => {
    expect(splitFrontmatter("---\r\ntitle: A\r\n---\r\nB").data).toEqual({
      title: "A",
    });
  });

  it("returns a page without frontmatter whole", () => {
    expect(splitFrontmatter("# Hi\n")).toEqual({ data: {}, body: "# Hi\n" });
  });
});

describe("expandAsides", () => {
  const title = (text: string) => `<b>${text}</b>`;

  it("wraps an aside's body as Markdown inside an aside element", () => {
    expect(expandAsides(":::note\nSome *text*.\n:::", title)).toBe(
      [
        '<aside class="aside aside-note">',
        '<p class="aside-title"><b>Note</b></p>',
        "",
        "Some *text*.",
        "",
        "</aside>",
      ].join("\n"),
    );
  });

  it("takes a title from the brackets", () => {
    expect(expandAsides(":::caution[`x` is empty]\nA\n:::", title)).toContain(
      '<p class="aside-title"><b>`x` is empty</b></p>',
    );
  });

  it("leaves ::: inside fenced code alone", () => {
    const body = "```md\n:::note\nA\n:::\n```";
    expect(expandAsides(body, title)).toBe(body);
  });

  it("refuses an aside that is never closed", () => {
    expect(() => expandAsides(":::tip\nA", title)).toThrow(/never closed/);
  });
});

describe("renderPage", () => {
  const source = [
    "---",
    'title: "Filesystem"',
    "---",
    "",
    "Intro with [a gg link](/gg/configurations/#granting-calls),",
    "[a cabinet link](/harnesses/overview/) and [a fragment](#paths).",
    "",
    ":::caution[`transpile` is empty]",
    "See [the shell](/gg/shell/).",
    ":::",
    "",
    "## Paths",
    "",
    "### The `read` call",
    "",
    "## Paths",
    "",
    "| A | B |",
    "| - | - |",
    "| 1 | 2 |",
    "",
    "```text",
    "<path> & [x](/gg/y/)",
    "```",
    "",
  ].join("\n");
  const page = renderPage("filesystem.md", source);

  it("takes the slug from the path and the title from the frontmatter", () => {
    expect(page.slug).toBe("filesystem");
    expect(page.title).toBe("Filesystem");
  });

  it("rewrites the links in the prose", () => {
    expect(page.html).toContain(
      '<a href="/docs/configurations/#granting-calls">a gg link</a>',
    );
    expect(page.html).toContain(
      '<a href="https://docs.testcabinet.ai/harnesses/overview/">',
    );
    expect(page.html).toContain('<a href="#paths">a fragment</a>');
  });

  it("rewrites links inside an aside and renders its title", () => {
    expect(page.html).toContain(
      '<p class="aside-title"><code>transpile</code> is empty</p>',
    );
    expect(page.html).toContain('<a href="/docs/shell/">the shell</a>');
  });

  it("anchors headings as Starlight does and lists them", () => {
    expect(page.html).toContain('<h2 id="paths">Paths</h2>');
    expect(page.html).toContain(
      '<h3 id="the-read-call">The <code>read</code> call</h3>',
    );
    expect(page.html).toContain('<h2 id="paths-1">Paths</h2>');
    expect(page.headings).toEqual([
      { depth: 2, id: "paths", text: "Paths" },
      { depth: 3, id: "the-read-call", text: "The read call" },
      { depth: 2, id: "paths-1", text: "Paths" },
    ]);
  });

  it("renders tables and escapes code", () => {
    expect(page.html).toContain("<table>");
    expect(page.html).toContain("&lt;path&gt; &amp; [x](/gg/y/)");
  });

  it("refuses a page without a title, naming it", () => {
    expect(() => renderPage("a/b.md", "---\nother: 1\n---\nText")).toThrow(
      "gg docs: a/b.md: its frontmatter has no title",
    );
    expect(() => renderPage("c.md", "Text")).toThrow(/c\.md/);
  });
});
