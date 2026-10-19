// Reads gg's documentation pages from a checkout of its `docs/` folder and
// lays them out as the docs section: every page rendered, and the sidebar.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { renderPage } from "./render.ts";
import type { DocPage, SidebarEntry, SidebarGroup } from "./types.ts";

/** The gg version the site presents, pinned in `apps/web/gg-docs.json`. */
export interface Pin {
  version: string;
  repository: string;
}

/** Reads and checks the pin. */
export function readPin(file: string): Pin {
  const pin: unknown = JSON.parse(readFileSync(file, "utf8"));
  const { version, repository } = (pin ?? {}) as Record<string, unknown>;
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`${file}: "version" must be a version such as 0.7.1`);
  }
  if (typeof repository !== "string" || repository === "") {
    throw new Error(`${file}: "repository" must name gg's repository`);
  }
  return { version, repository };
}

/**
 * The folder the pages are read from: `GG_DOCS_DIR` when it is set (relative
 * to the repository's root, so `../gg/docs` in the superrepo), otherwise
 * where `scripts/gg-docs.sh` puts the pinned version's pages.
 */
export function docsDir(
  repoRoot: string,
  version: string,
  override: string | undefined,
): string {
  if (override) return path.resolve(repoRoot, override);
  return path.join(repoRoot, "apps", "web", ".gg-docs", `v${version}`, "docs");
}

/** Every `*.md` under `dir`, as paths relative to it, in a stable order. */
export function listPages(dir: string): string[] {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(
      `gg docs: ${dir} does not exist; run scripts/gg-docs.sh to fetch the ` +
        "pinned version's pages, or set GG_DOCS_DIR to a checkout of gg's docs/",
    );
  }
  const found: string[] = [];
  const walk = (relDir: string) => {
    const entries = readdirSync(path.join(dir, relDir), {
      withFileTypes: true,
    }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(rel);
      else if (entry.isFile() && entry.name.endsWith(".md")) found.push(rel);
    }
  };
  walk("");
  if (found.length === 0) throw new Error(`gg docs: ${dir} holds no pages`);
  return found;
}

/** The label of a folder's group: its name, in sentence case. */
export function groupLabel(folder: string): string {
  const words = folder.replaceAll("-", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const byLabel = (a: { label: string }, b: { label: string }) =>
  a.label.localeCompare(b.label);

/**
 * The sidebar, from the folder tree: at each level its overview first, then
 * its other pages by title, then a group per subfolder by name.
 */
export function buildSidebar(
  pages: Pick<DocPage, "slug" | "title">[],
): SidebarEntry[] {
  const root: SidebarGroup = { kind: "group", label: "", items: [] };
  const groups = new Map<string, SidebarGroup>([["", root]]);
  const groupFor = (folder: string): SidebarGroup => {
    const known = groups.get(folder);
    if (known) return known;
    const cut = folder.lastIndexOf("/");
    const parent = groupFor(cut < 0 ? "" : folder.slice(0, cut));
    const group: SidebarGroup = {
      kind: "group",
      label: groupLabel(folder.slice(cut + 1)),
      items: [],
    };
    parent.items.push(group);
    groups.set(folder, group);
    return group;
  };
  for (const page of pages) {
    const cut = page.slug.lastIndexOf("/");
    groupFor(cut < 0 ? "" : page.slug.slice(0, cut)).items.push({
      kind: "link",
      label: page.title,
      slug: page.slug,
    });
  }
  const order = (group: SidebarGroup): SidebarEntry[] => {
    const isOverview = (entry: SidebarEntry) =>
      entry.kind === "link" &&
      (entry.slug === "overview" || entry.slug.endsWith("/overview"));
    const links = group.items.filter((entry) => entry.kind === "link");
    const subgroups = group.items.filter((entry) => entry.kind === "group");
    return [
      ...links.filter(isOverview),
      ...links.filter((entry) => !isOverview(entry)).sort(byLabel),
      ...subgroups.sort(byLabel).map((sub) => ({ ...sub, items: order(sub) })),
    ];
  };
  return order(root);
}

export interface DocsSite {
  version: string;
  pages: DocPage[];
  sidebar: SidebarEntry[];
}

/** Reads and renders every page under `dir`. */
export function loadSite(dir: string, version: string): DocsSite {
  const pages = listPages(dir).map((rel) =>
    renderPage(rel, readFileSync(path.join(dir, rel), "utf8")),
  );
  return { version, pages, sidebar: buildSidebar(pages) };
}
