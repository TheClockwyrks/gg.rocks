import type { ReactNode } from "react";
import type { ExperimentStatus } from "@/data/experiments";
import { cx } from "@/utils/cx";
import styles from "./StatusPill.module.scss";

interface StatusPillProps {
  status: ExperimentStatus;
  children: ReactNode;
}

export function StatusPill({ status, children }: StatusPillProps) {
  return <span className={cx(styles.pill, styles[status])}>{children}</span>;
}
