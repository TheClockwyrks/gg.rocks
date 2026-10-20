import { useEffect, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { pages, sidebar, version } from "virtual:gg-docs";
import { NotFound } from "@/pages/ComingSoon/ComingSoon";
import { cx } from "@/utils/cx";
import { routeFor, slugOf } from "../../../plugins/ggDocs/routes";
import type { DocPage, SidebarEntry } from "../../../plugins/ggDocs/types";
import styles from "./Docs.module.scss";

/**
 * gg's documentation, from the pages of the `gg` repository's `docs/` at the
 * version the site pins: the sidebar, the page and its contents.
 */
export function Docs() {
  const slug = slugOf(useParams()["*"]);
  const entry = pages[slug];
  const [page, setPage] = useState<DocPage | null>(null);
  const [failed, setFailed] = useState(false);
  const { hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!entry) return;
    let current = true;
    setFailed(false);
    entry.load().then(
      (loaded) => current && setPage(loaded.default),
      () => current && setFailed(true),
    );
    return () => {
      current = false;
    };
  }, [entry]);

  const shown = page?.slug === slug ? page : null;

  useEffect(() => {
    if (!entry) return;
    const previous = document.title;
    document.title = `${entry.title} · gg docs`;
    return () => {
      document.title = previous;
    };
  }, [entry]);

  // The page arrives after the navigation, so a fragment is scrolled to once
  // the heading it names is on the page.
  useEffect(() => {
    if (!shown || !hash) return;
    document
      .getElementById(decodeURIComponent(hash.slice(1)))
      ?.scrollIntoView();
  }, [shown, hash]);

  if (!entry) return <NotFound />;

  // A link to another page of the section is followed without reloading.
  const onClick = (event: MouseEvent<HTMLElement>) => {
    const anchor = (event.target as Element).closest("a");
    const href = anchor?.getAttribute("href");
    if (
      !anchor ||
      !href?.startsWith("/") ||
      href.startsWith("//") ||
      anchor.target ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(href);
  };

  return (
    <div className={styles.docs}>
      <aside className={styles.sidebar}>
        {/* Keyed by page, so the menu is closed again on the next page. */}
        <details key={slug} className={styles.menu}>
          <summary className={styles.menuToggle}>Pages</summary>
          <Sidebar entries={sidebar} current={slug} />
        </details>
        <div className={styles.fullSidebar}>
          <Sidebar entries={sidebar} current={slug} />
        </div>
      </aside>

      <main className={styles.main}>
        <article className={styles.article}>
          <span className={styles.eyebrow}>gg {version} · Docs</span>
          <h1 className={styles.title}>{entry.title}</h1>
          {shown ? (
            <div
              className={styles.content}
              onClick={onClick}
              dangerouslySetInnerHTML={{ __html: shown.html }}
            />
          ) : (
            <p className={styles.status}>
              {failed ? "This page could not be loaded." : "Loading…"}
            </p>
          )}
        </article>

        {shown && shown.headings.length > 0 && (
          <nav aria-label="On this page" className={styles.toc}>
            <span className={styles.tocLabel}>On this page</span>
            <ul>
              {shown.headings.map((heading) => (
                <li
                  key={heading.id}
                  className={cx(heading.depth === 3 && styles.tocNested)}
                >
                  <Link to={{ hash: heading.id }}>{heading.text}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </main>
    </div>
  );
}

function Sidebar({
  entries,
  current,
}: {
  entries: SidebarEntry[];
  current: string;
}) {
  return (
    <ul className={styles.tree}>
      {entries.map((entry) =>
        entry.kind === "link" ? (
          <li key={entry.slug}>
            <Link
              to={routeFor(entry.slug)}
              aria-current={entry.slug === current ? "page" : undefined}
              className={cx(
                styles.treeLink,
                entry.slug === current && styles.treeCurrent,
              )}
            >
              {entry.label}
            </Link>
          </li>
        ) : (
          <li key={entry.label} className={styles.treeGroup}>
            <span className={styles.treeLabel}>{entry.label}</span>
            <Sidebar entries={entry.items} current={current} />
          </li>
        ),
      )}
    </ul>
  );
}
