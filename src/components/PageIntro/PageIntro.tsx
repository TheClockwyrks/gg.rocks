import type { ReactNode } from "react";
import styles from "./PageIntro.module.scss";

interface PageIntroProps {
	eyebrow: string;
	title: string;
	children: ReactNode;
}

/** Eyebrow, title and lead paragraph that open a section page. */
export function PageIntro({ eyebrow, title, children }: PageIntroProps) {
	return (
		<div className={styles.intro}>
			<span className={styles.eyebrow}>{eyebrow}</span>
			<h1 className={styles.title}>{title}</h1>
			<p className={styles.lead}>{children}</p>
		</div>
	);
}
