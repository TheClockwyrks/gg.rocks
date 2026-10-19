// The modules plugins/ggDocs/plugin.ts generates at build time.

declare module "virtual:gg-docs" {
  import type { DocPage, SidebarEntry } from "../plugins/ggDocs/types";

  /** The gg version whose documentation pages these are. */
  export const version: string;
  export const sidebar: SidebarEntry[];
  export const pages: Record<
    string,
    { title: string; load: () => Promise<{ default: DocPage }> }
  >;
}
