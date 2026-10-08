import type { ReactNode } from "react";
import styles from "./Account.module.scss";

interface AccountSectionProps {
	title: string;
	summary?: string;
	children: ReactNode;
}

/** A band of an account page: its name in the margin, its content beside. */
export function AccountSection({
	title,
	summary,
	children,
}: AccountSectionProps) {
	return (
		<section className={styles.section}>
			<header className={styles.sectionHeading}>
				<h2 className={styles.sectionTitle}>{title}</h2>
				{summary && <p className={styles.sectionSummary}>{summary}</p>}
			</header>
			<div className={styles.sectionBody}>{children}</div>
		</section>
	);
}

/** Shown in place of a tab's content while it loads, or if that fails. */
export function AccountStatus({ children }: { children: ReactNode }) {
	return <p className={styles.status}>{children}</p>;
}
