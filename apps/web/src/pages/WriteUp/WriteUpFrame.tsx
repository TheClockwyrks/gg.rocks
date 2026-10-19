import type { ReactNode } from "react";
import { Link } from "react-router";
import { PageNotice } from "@/components/PageNotice/PageNotice";
import { StatusPill } from "@/components/StatusPill/StatusPill";
import type { ExperimentStatus } from "@/data/experiments";
import { sections } from "@/data/site";
import { Toc, type TocItem } from "./Toc";
import styles from "./WriteUpFrame.module.scss";

interface WriteUpFrameProps {
  name: string;
  status: ExperimentStatus;
  /** Outcome as shown in the status pill. */
  outcome: string;
  timeline: string;
  /** A note about the page itself, shown above the title. */
  notice?: string;
  toc: TocItem[];
  children: ReactNode;
}

/**
 * The fixed frame every experiment write-up shares: table of contents,
 * breadcrumb, outcome and title. The sections themselves are the children.
 */
export function WriteUpFrame({
  name,
  status,
  outcome,
  timeline,
  notice,
  toc,
  children,
}: WriteUpFrameProps) {
  return (
    <div className={styles.frame}>
      <Toc items={toc} />
      <main className={styles.article}>
        <header className={styles.header}>
          {notice && <PageNotice>{notice}</PageNotice>}
          <span className={styles.breadcrumb}>
            <Link to={sections.experiments.path}>
              {sections.experiments.label}
            </Link>{" "}
            / {name}
          </span>
          <div className={styles.status}>
            <StatusPill status={status}>{outcome}</StatusPill>
            <span className={styles.timeline}>{timeline}</span>
          </div>
          <h1 className={styles.title}>{name}</h1>
        </header>
        {children}
      </main>
    </div>
  );
}
