// The Vite plugin behind the docs section. It serves two kinds of virtual
// module, read by src/pages/Docs:
//
// - `virtual:gg-docs`: the version, the sidebar and, per page, its title and
//   a loader;
// - `virtual:gg-docs/page/<slug>`: one rendered page, so each page is a chunk
//   of its own and a visitor downloads only the pages they open.
//
// The pages are read when the first of these is loaded, not when the config
// is, so a test run that never imports them needs no pages on disk.
import type { Plugin, ViteDevServer } from "vite";
import { docsDir, loadSite, readPin, type DocsSite } from "./site.ts";

export const INDEX_ID = "virtual:gg-docs";
export const PAGE_PREFIX = "virtual:gg-docs/page/";

/** The source of `virtual:gg-docs`. */
export function indexModule(site: DocsSite): string {
  const entries = site.pages.map(
    (page) =>
      `  ${JSON.stringify(page.slug)}: { title: ${JSON.stringify(page.title)}, ` +
      `load: () => import(${JSON.stringify(PAGE_PREFIX + page.slug)}) },`,
  );
  return [
    `export const version = ${JSON.stringify(site.version)};`,
    `export const sidebar = ${JSON.stringify(site.sidebar)};`,
    "export const pages = {",
    ...entries,
    "};",
    "",
  ].join("\n");
}

/** The source of `virtual:gg-docs/page/<slug>`, or null for no such page. */
export function pageModule(site: DocsSite, slug: string): string | null {
  const page = site.pages.find((candidate) => candidate.slug === slug);
  return page ? `export default ${JSON.stringify(page)};\n` : null;
}

export interface GgDocsOptions {
  /** The repository's root, which `GG_DOCS_DIR` is relative to. */
  repoRoot: string;
  /** The pin, `apps/web/gg-docs.json`. */
  pinFile: string;
  /** `GG_DOCS_DIR`, when set. */
  override?: string;
}

export function ggDocs(options: GgDocsOptions): Plugin {
  let site: DocsSite | null = null;
  let dir: string | null = null;
  let server: ViteDevServer | null = null;

  const load = (): DocsSite => {
    if (!site) {
      const { version } = readPin(options.pinFile);
      dir = docsDir(options.repoRoot, version, options.override);
      site = loadSite(dir, version);
      // GG_DOCS_DIR may lie outside the project the dev server watches.
      server?.watcher.add(dir);
    }
    return site;
  };

  return {
    name: "gg-docs",
    resolveId(id) {
      return id === INDEX_ID || id.startsWith(PAGE_PREFIX) ? `\0${id}` : null;
    },
    load(id) {
      if (!id.startsWith("\0")) return null;
      const name = id.slice(1);
      if (name === INDEX_ID) {
        return indexModule(load());
      }
      if (name.startsWith(PAGE_PREFIX)) {
        const slug = name.slice(PAGE_PREFIX.length);
        const source = pageModule(load(), slug);
        if (source === null) this.error(`gg docs: no page ${slug}`);
        return source;
      }
      return null;
    },
    configureServer(devServer) {
      server = devServer;
      // An edit to a page reloads the docs section.
      devServer.watcher.on("all", (_event, file) => {
        if (!dir || !file.startsWith(dir) || !file.endsWith(".md")) return;
        site = null;
        for (const module of devServer.moduleGraph.idToModuleMap.values()) {
          if (module.id?.startsWith(`\0${INDEX_ID}`)) {
            devServer.moduleGraph.invalidateModule(module);
          }
        }
        devServer.ws.send({ type: "full-reload" });
      });
    },
  };
}
