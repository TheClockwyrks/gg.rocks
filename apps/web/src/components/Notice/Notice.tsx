import type { ReactNode } from "react";
import { cx } from "@/utils/cx";
import styles from "./Notice.module.scss";

interface NoticeProps {
  tone: "error" | "success";
  children: ReactNode;
}

/** The outcome of an action, announced to assistive technology. */
export function Notice({ tone, children }: NoticeProps) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cx(styles.notice, styles[tone])}
    >
      {children}
    </p>
  );
}
