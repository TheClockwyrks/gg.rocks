import { useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { Wordmark } from "@/components/Wordmark";
import { sections, type SectionId } from "@/data/site";
import { cx } from "@/utils/cx";
import { useElementSize } from "@/utils/useElementSize";
import { fraction, type NetLayout, type Point } from "./layouts";
import { Network } from "./Network";
import { useNetLayout } from "./useNetLayout";
import styles from "./Landing.module.scss";

interface NodeCopy {
	/** Larger label with a line of description underneath. */
	primary: boolean;
	meta?: { full: string; short: string };
}

const nodeCopy: Record<SectionId, NodeCopy> = {
	experiments: {
		primary: true,
		meta: {
			full: "what we're trying right now",
			short: "what we're trying now",
		},
	},
	benchmarks: {
		primary: true,
		meta: {
			full: "gg vs. other harnesses, on TTC data",
			short: "gg vs. other harnesses",
		},
	},
	download: {
		primary: true,
		meta: {
			full: "gg [version] · pre-release",
			short: "gg [version] · pre-release",
		},
	},
	changelog: { primary: false },
	docs: { primary: false },
};

/** Places an element at a point on the layout's design canvas. */
function position(layout: NetLayout, at: Point): CSSProperties {
	const [fx, fy] = fraction(layout, at);
	return { "--fx": fx, "--fy": fy } as CSSProperties;
}

export function Landing() {
	const layout = useNetLayout();
	const [ref, size] = useElementSize<HTMLElement>();
	const [active, setActive] = useState<SectionId | null>(null);
	const wide = layout.id === "wide";

	return (
		<main
			ref={ref}
			className={cx(styles.landing, styles[layout.id])}
			style={
				{
					"--ox": `${layout.origin[0]}px`,
					"--oy": `${layout.origin[1]}px`,
				} as CSSProperties
			}
		>
			{size && (
				<Network
					// Remounting restarts the animation, so the network regrows
					// from the wordmark whenever the arrangement changes.
					key={layout.id}
					layout={layout}
					size={size}
					active={active}
				/>
			)}

			<div className={styles.brand}>
				<Wordmark className={styles.wordmark} />
				<span className={styles.badge}>pre-release</span>
			</div>

			<div className={styles.hero}>
				<span className={styles.eyebrow}>Experimental coding harness</span>
				<h1 className={styles.title}>
					Fan out. Test everything. Keep what wins.
				</h1>
				{wide ? (
					<>
						<p className={styles.lead}>
							gg is where new harness ideas get tried against real benchmark
							runs. The ones that cut cost and raise pass rates ship to
							Vantacode. Every experiment, kept or retired, gets a full
							write-up.
						</p>
						<p className={styles.latest}>
							latest result: <span className={styles.figure}>[+x%]</span> pass
							rate · <span className={styles.figure}>[−y%]</span> cost vs.
							[baseline harness]
						</p>
					</>
				) : (
					<p className={styles.lead}>
						New harness ideas, tested on real benchmark runs. Winners ship to
						Vantacode, and every experiment gets a write-up.
					</p>
				)}
			</div>

			<nav aria-label="Sections">
				{layout.nodes.map((node) => {
					const copy = nodeCopy[node.id];
					return (
						<Link
							key={node.id}
							to={sections[node.id].path}
							className={cx(
								styles.node,
								copy.primary ? styles.primary : styles.secondary,
								active !== null && active !== node.id && styles.faded,
							)}
							style={position(layout, node.at)}
							onMouseEnter={() => setActive(node.id)}
							onMouseLeave={() => setActive(null)}
							onFocus={() => setActive(node.id)}
							onBlur={() => setActive(null)}
						>
							<span className={styles.label}>{sections[node.id].label}</span>
							{copy.meta && (
								<span className={styles.meta}>
									{wide ? copy.meta.full : copy.meta.short}
								</span>
							)}
						</Link>
					);
				})}
			</nav>

			{layout.tag && (
				<span
					className={cx(
						styles.tag,
						active !== null &&
							!layout.tag.serves.includes(active) &&
							styles.dimmed,
					)}
					style={
						{
							...position(layout, layout.tag.at),
							"--delay": `${layout.settled}ms`,
						} as CSSProperties
					}
				>
					<span className={styles.tagText}>{layout.tag.text}</span>
				</span>
			)}

			<p className={styles.footnote}>
				Results come from The Test Cabinet runs. Its methodology is open source.
			</p>
		</main>
	);
}
