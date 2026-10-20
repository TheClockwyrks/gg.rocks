// Where the docs section's pages are served. Both the build and the page
// import it, so it imports nothing.

/** Where the pages are served on this site. */
export const DOCS_ROUTE = "/docs";

/** The page `/docs` itself shows. */
export const HOME_SLUG = "overview";

/** The route of the page with this slug. */
export function routeFor(slug: string): string {
  return `${DOCS_ROUTE}/${slug}/`;
}

/** The slug a `/docs/*` address names: `/docs/a/b/` and `/docs/a/b` alike. */
export function slugOf(splat: string | undefined): string {
  const slug = (splat ?? "").replace(/^\/+|\/+$/g, "");
  return slug === "" ? HOME_SLUG : slug;
}
