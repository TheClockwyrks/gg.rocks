// The shapes the docs section is built from. The build writes them into the
// `virtual:gg-docs` modules (plugin.ts) and the docs page reads them back, so
// both sides import them from here.

/** A heading of a page, for its contents list. */
export interface DocHeading {
  /** 2 or 3: the page's title is its only first-level heading. */
  depth: number;
  /** The anchor, as Starlight writes it, so a `#fragment` link still lands. */
  id: string;
  text: string;
}

/** One documentation page, rendered. */
export interface DocPage {
  /** The page's path under `docs/` without `.md`, such as `languages/rust`. */
  slug: string;
  title: string;
  html: string;
  headings: DocHeading[];
}

export interface SidebarLink {
  kind: "link";
  label: string;
  slug: string;
}

export interface SidebarGroup {
  kind: "group";
  label: string;
  items: SidebarEntry[];
}

export type SidebarEntry = SidebarLink | SidebarGroup;
