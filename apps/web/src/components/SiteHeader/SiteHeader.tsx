import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { AccountLink } from "@/components/AccountLink/AccountLink";
import { Wordmark } from "@/components/Wordmark";
import { headerNav, sections } from "@/data/site";
import { cx } from "@/utils/cx";
import styles from "./SiteHeader.module.scss";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Wordmark />
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <nav
          id="site-nav"
          aria-label="Primary"
          className={cx(styles.nav, open && styles.open)}
          onClick={() => setOpen(false)}
        >
          {headerNav.map((id) => (
            <NavLink
              key={id}
              to={sections[id].path}
              className={({ isActive }) =>
                cx(styles.link, isActive && styles.current)
              }
            >
              {sections[id].label}
            </NavLink>
          ))}
          <NavLink to={sections.download.path} className={styles.download}>
            {sections.download.label}
          </NavLink>
          <AccountLink className={styles.account} />
        </nav>
      </div>
    </header>
  );
}
