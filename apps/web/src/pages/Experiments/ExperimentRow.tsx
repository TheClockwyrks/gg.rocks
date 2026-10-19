import type { ReactNode } from "react";
import { Link } from "react-router";
import { StatusPill } from "@/components/StatusPill/StatusPill";
import {
  metricLabels,
  writeUpPath,
  type Experiment,
  type ExperimentDeltas,
} from "@/data/experiments";
import { cx } from "@/utils/cx";
import { Sparkline } from "./Sparkline";
import styles from "./ExperimentRow.module.scss";

const metrics = Object.keys(metricLabels) as (keyof ExperimentDeltas)[];

/** Column headings; only shown where the rows are laid out as a table. */
export function ExperimentHeadings() {
  return (
    <div className={styles.headings} aria-hidden="true">
      <span />
      <span>Experiment</span>
      {metrics.map((metric) => (
        <span key={metric}>{metricLabels[metric]}</span>
      ))}
      <span>Outcome</span>
    </div>
  );
}

export function ExperimentRow({ experiment }: { experiment: Experiment }) {
  const content: ReactNode = (
    <>
      <span className={styles.spark}>
        <Sparkline status={experiment.status} />
      </span>
      <span className={styles.identity}>
        <span className={styles.name}>{experiment.name}</span>
        <span className={styles.timeline}>{experiment.timeline}</span>
      </span>
      <span className={styles.metrics}>
        {metrics.map((metric) => (
          <span key={metric} className={styles.metric}>
            <span className={styles.metricLabel}>{metricLabels[metric]}</span>
            {experiment.deltas[metric]}
          </span>
        ))}
      </span>
      <span className={styles.outcome}>
        <StatusPill status={experiment.status}>{experiment.outcome}</StatusPill>
      </span>
    </>
  );

  // Only concluded experiments have a write-up to open.
  return (
    <li>
      {experiment.writeUp ? (
        <Link
          to={writeUpPath(experiment.writeUp)}
          className={cx(styles.row, styles.link)}
        >
          {content}
        </Link>
      ) : (
        <div className={styles.row}>{content}</div>
      )}
    </li>
  );
}
