import type { ReactNode } from "react";
import styles from "./PageNotice.module.scss";

/** A note about the page itself, such as its data being invented. */
export function PageNotice({ children }: { children: ReactNode }) {
	return <p className={styles.notice}>{children}</p>;
}
