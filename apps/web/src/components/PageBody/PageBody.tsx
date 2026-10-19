import type { ReactNode } from "react";
import { SectionRail } from "@/components/SectionRail/SectionRail";
import type { SectionId } from "@/data/site";
import { cx } from "@/utils/cx";
import styles from "./PageBody.module.scss";

interface PageBodyProps {
  /** Show the section strand down the left margin, lit at this section. */
  rail?: SectionId;
  width?: "wide" | "narrow";
  children: ReactNode;
}

/**
 * Main column of a section page. It lines up with the top bar, or is indented
 * to leave room for the strand when there is one.
 */
export function PageBody({ rail, width = "wide", children }: PageBodyProps) {
  return (
    <div className={styles.body}>
      {rail && <SectionRail current={rail} />}
      <main className={cx(styles.main, styles[width], rail && styles.railed)}>
        {children}
      </main>
    </div>
  );
}
