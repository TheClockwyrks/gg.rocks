// Turns one of gg's documentation pages into the HTML the site shows.
//
// The pages are written for the superrepo's Starlight site, where they live
// under `/gg/` beside The Test Cabinet's own pages. Here they live under
// `/docs/`, so a link into gg's pages is moved there and a link to any other
// page of that site goes to it at docs.testcabinet.ai. The rest is what
// Starlight would do with the same file: the title from the frontmatter,
// GitHub's heading anchors, and the `:::note` asides.
import GithubSlugger from "github-slugger";
import MarkdownIt from "markdown-it";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";
import { parse as parseYaml } from "yaml";
import { DOCS_ROUTE } from "./routes.ts";
import type { DocHeading, DocPage } from "./types.ts";

/** The Test Cabinet's documentation site, which the pages link into. */
export const DOCS_ORIGIN = "https://docs.testcabinet.ai";

/** The slug of the page at this path under `docs/`. */
export function slugFor(relPath: string): string {
  return relPath.replaceAll("\\", "/").replace(/\.md$/, "");
}

/**
 * A link as this site serves it: `/gg/…` becomes `/docs/…`, any other
 * root-relative link goes to the same path on docs.testcabinet.ai, and
 * fragments, relative links and full addresses are kept.
 */
export function rewriteHref(href: string): string {
  if (/^\/gg(?=[/#?]|$)/.test(href)) {
    const rest = href.slice("/gg".length);
    return DOCS_ROUTE + (rest.startsWith("/") ? rest : `/${rest}`);
  }
  if (href.startsWith("/") && !href.startsWith("//")) {
    return DOCS_ORIGIN + href;
  }
  return href;
}

/** Splits a page into its frontmatter's fields and its body. */
export function splitFrontmatter(source: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const text = source.replace(/\r\n?/g, "\n");
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
  if (!match) return { data: {}, body: text };
  const data: unknown = parseYaml(match[1] ?? "");
  return {
    data:
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : {},
    body: text.slice(match[0].length),
  };
}

const ASIDE_LABELS: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  caution: "Caution",
  danger: "Danger",
};

const ASIDE_OPEN = /^:::(note|tip|caution|danger)(?:\[(.*)\])?\s*$/;
const ASIDE_CLOSE = /^:::\s*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/**
 * Rewrites Starlight's `:::note[Title]` … `:::` asides as HTML blocks around
 * the Markdown they hold, leaving fenced code alone. The blank lines around
 * the body end each HTML block, so the body is still read as Markdown.
 */
export function expandAsides(
  body: string,
  renderTitle: (title: string) => string,
): string {
  const out: string[] = [];
  let fence: string | null = null;
  let open = 0;
  for (const line of body.split("\n")) {
    const marker = FENCE.exec(line)?.[1];
    if (fence) {
      if (
        marker &&
        marker[0] === fence[0] &&
        marker.length >= fence.length &&
        line.trim() === marker
      ) {
        fence = null;
      }
      out.push(line);
      continue;
    }
    if (marker) {
      fence = marker;
      out.push(line);
      continue;
    }
    const aside = ASIDE_OPEN.exec(line);
    if (aside) {
      const kind = aside[1] ?? "note";
      const title = aside[2] ?? ASIDE_LABELS[kind] ?? kind;
      open += 1;
      out.push(
        `<aside class="aside aside-${kind}">`,
        `<p class="aside-title">${renderTitle(title)}</p>`,
        "",
      );
      continue;
    }
    if (open > 0 && ASIDE_CLOSE.test(line)) {
      open -= 1;
      out.push("", "</aside>");
      continue;
    }
    out.push(line);
  }
  if (open > 0) throw new Error("an aside opened with ::: is never closed");
  return out.join("\n");
}

interface RenderEnv {
  headings: DocHeading[];
}

function createMarkdown(): MarkdownIt {
  const md = new MarkdownIt({ html: true, linkify: false, typographer: false });

  // Every heading gets the anchor GitHub's slugger gives its text, which is
  // the one Starlight gives it, so links between the pages keep landing.
  md.core.ruler.push("gg_docs_anchors", (state: StateCore) => {
    const env = state.env as RenderEnv;
    const slugger = new GithubSlugger();
    const tokens = state.tokens;
    tokens.forEach((token, index) => {
      if (token.type !== "heading_open") return;
      const inline = tokens[index + 1];
      const text = (inline?.children ?? [])
        .filter(
          (child) => child.type === "text" || child.type === "code_inline",
        )
        .map((child) => child.content)
        .join("");
      const id = slugger.slug(text);
      token.attrSet("id", id);
      const depth = Number(token.tag.slice(1));
      if (depth === 2 || depth === 3) env.headings.push({ depth, id, text });
    });
  });

  // Links are moved to where this site serves the page they name.
  md.core.ruler.push("gg_docs_links", (state: StateCore) => {
    for (const token of state.tokens) {
      for (const child of token.children ?? []) {
        if (child.type !== "link_open") continue;
        const href = child.attrGet("href");
        if (href !== null) child.attrSet("href", rewriteHref(href));
      }
    }
  });

  return md;
}

const markdown = createMarkdown();

/** Renders the page at `relPath` (a path under `docs/`) from its source. */
export function renderPage(relPath: string, source: string): DocPage {
  const slug = slugFor(relPath);
  try {
    const { data, body } = splitFrontmatter(source);
    const title = data.title;
    if (typeof title !== "string" || title.trim() === "") {
      throw new Error("its frontmatter has no title");
    }
    const env: RenderEnv = { headings: [] };
    const expanded = expandAsides(body, (text) => markdown.renderInline(text));
    const html = markdown.render(expanded, env);
    return { slug, title, html, headings: env.headings };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`gg docs: ${relPath}: ${reason}`, { cause: error });
  }
}
