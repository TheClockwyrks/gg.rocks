import type { ReactNode } from "react";
import type { Rating } from "@/data/writeUps/types";
import { cx } from "@/utils/cx";
import styles from "./Figure.module.scss";

export interface LegendItem {
	label: string;
	swatch: "diamond" | "dot" | "block" | "line";
	tone: "accent" | "info" | "strand" | "subtle" | Rating;
}

interface FigureProps {
	title: string;
	/** Short reading aid shown next to the title. */
	hint?: string;
	legend?: LegendItem[];
	/** Small print below the figure. */
	note?: string;
	children: ReactNode;
}

/** A titled chart or table in a write-up, with optional legend and note. */
export function Figure({ title, hint, legend, note, children }: FigureProps) {
	return (
		<figure className={styles.figure}>
			<figcaption className={styles.caption}>
				<span className={styles.title}>{title}</span>
				{hint && <span className={styles.hint}>{hint}</span>}
			</figcaption>
			{legend && (
				<ul className={styles.legend}>
					{legend.map((item) => (
						<li
							key={item.label}
							className={styles.legendItem}
						>
							<span
								className={cx(
									styles.swatch,
									styles[item.swatch],
									styles[item.tone],
								)}
							/>
							{item.label}
						</li>
					))}
				</ul>
			)}
			{children}
			{note && <p className={styles.note}>{note}</p>}
		</figure>
	);
}

interface FigureScrollProps {
	/** Keep more width before scrolling, for charts with small labels. */
	wide?: boolean;
	children: ReactNode;
}

/** Lets a fixed-proportion chart or table scroll sideways on narrow screens. */
export function FigureScroll({ wide, children }: FigureScrollProps) {
	return (
		<div
			className={styles.scroll}
			tabIndex={0}
		>
			<div className={cx(styles.scrollInner, wide && styles.wide)}>
				{children}
			</div>
		</div>
	);
}
