import { cx } from "@/utils/cx";
import styles from "./Verdict.module.scss";

export interface VerdictStat {
	value: string;
	label: string;
}

interface VerdictProps {
	status: "shipped" | "retired";
	summary: string;
	stats: VerdictStat[];
	/** What the numbers are measured against. */
	basis: string;
}

/** The decision up front: most readers stop here. */
export function Verdict({ status, summary, stats, basis }: VerdictProps) {
	return (
		<section
			id="verdict"
			className={cx(styles.verdict, styles[status])}
		>
			<h2 className={styles.eyebrow}>Verdict · {status}</h2>
			<p className={styles.summary}>{summary}</p>
			<div className={styles.statsFrame}>
				<dl className={styles.stats}>
					{stats.map((stat) => (
						<div
							key={stat.label}
							className={styles.stat}
						>
							<dt className={styles.label}>{stat.label}</dt>
							<dd className={styles.value}>{stat.value}</dd>
						</div>
					))}
				</dl>
			</div>
			<p className={styles.basis}>{basis}</p>
		</section>
	);
}
