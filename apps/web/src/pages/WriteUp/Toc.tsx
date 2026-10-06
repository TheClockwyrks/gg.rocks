import { useEffect, useRef, useState, type MouseEvent } from "react";
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
 * a bar pinned under the top bar that shows the current section and unfolds
 * in place to list them all.
 */
export function Toc({ items }: { items: TocItem[] }) {
	const active = useActiveSection(items.map((item) => item.id));
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLElement>(null);
	const row = tokens.tapTarget;

	// While the menu is open, close it on Escape or a press anywhere else.
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		const onPointerDown = (event: PointerEvent) => {
			if (!ref.current?.contains(event.target as Node)) setOpen(false);
		};
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("pointerdown", onPointerDown);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("pointerdown", onPointerDown);
		};
	}, [open]);

	const jump = (event: MouseEvent, id: string) => {
		event.preventDefault();
		setOpen(false);
		document.getElementById(id)?.scrollIntoView();
	};

	return (
		<nav
			ref={ref}
			aria-label="On this page"
			className={styles.toc}
		>
			<div
				id="toc-sections"
				className={cx(styles.track, open && styles.open)}
			>
				<button
					type="button"
					className={styles.toggle}
					aria-label={open ? "Hide sections" : "Show sections"}
					aria-expanded={open}
					aria-controls="toc-sections"
					onClick={() => setOpen((value) => !value)}
				>
					<svg
						width="12"
						height="8"
						viewBox="0 0 12 8"
						className={styles.chevron}
						aria-hidden="true"
					>
						<path d="M1 1.5 6 6.5 11 1.5" />
					</svg>
				</button>
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
