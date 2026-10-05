import type { MouseEvent } from "react";
import { Strand } from "@/components/Strand/Strand";
import { cx } from "@/utils/cx";
import { tokens } from "@/utils/tokens";
import { useActiveSection } from "./useActiveSection";
import styles from "./Toc.module.scss";

const STRAND_WIDTH = 24;
const STRAND_TAIL = 16;

export interface TocItem {
	id: string;
	label: string;
}

/**
 * Table of contents for a write-up. Beside the article it runs down a strand
 * whose nodes fill in as sections are passed; on narrower screens it becomes
 * a row of links pinned under the top bar.
 */
export function Toc({ items }: { items: TocItem[] }) {
	const active = useActiveSection(items.map((item) => item.id));
	const row = tokens.tapTarget;

	const jump = (event: MouseEvent, id: string) => {
		event.preventDefault();
		document.getElementById(id)?.scrollIntoView();
	};

	return (
		<nav
			aria-label="On this page"
			className={styles.toc}
		>
			<div className={styles.track}>
				<Strand
					width={STRAND_WIDTH}
					height={items.length * row + STRAND_TAIL}
					nodes={items.map((_, index) => row / 2 + index * row)}
					current={items.findIndex((item) => item.id === active)}
					tone="muted"
					fillPassed
					className={styles.strand}
				/>
				{items.map((item) => (
					<a
						key={item.id}
						href={`#${item.id}`}
						aria-current={item.id === active ? "location" : undefined}
						className={cx(styles.link, item.id === active && styles.current)}
						onClick={(event) => jump(event, item.id)}
					>
						{item.label}
					</a>
				))}
			</div>
		</nav>
	);
}
