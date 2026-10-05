import type { CSSProperties } from "react";
import { Diamond } from "@/components/Strand/Diamond";
import type { SectionId } from "@/data/site";
import { cx } from "@/utils/cx";
import type { Size } from "@/utils/useElementSize";
import {
	scalePath,
	scalePoint,
	type NetLayout,
	type NetStroke,
} from "./layouts";
import styles from "./Network.module.scss";

const PRIMARY_MARKER_SIZE = 14;
const SECONDARY_MARKER_SIZE = 10;

/** Sections drawn with the smaller marker. */
const secondary: ReadonlySet<SectionId> = new Set(["changelog", "docs"]);

function timing({ delay, duration }: NetStroke): CSSProperties {
	return {
		"--delay": `${delay}ms`,
		"--duration": `${duration}ms`,
	} as CSSProperties;
}

interface NetworkProps {
	layout: NetLayout;
	size: Size;
	/** The node being hovered or focused; every other path dims. */
	active: SectionId | null;
}

/** The animated network of strands behind the landing page. */
export function Network({ layout, size, active }: NetworkProps) {
	const plot = (d: string) => scalePath(layout, d, size.width, size.height);
	const dimmed = (serves: SectionId[]) =>
		active !== null && !serves.includes(active) && styles.dimmed;
	const lit = layout.routes.filter((route) => route.tone === "accent");

	return (
		<svg
			width={size.width}
			height={size.height}
			className={cx(styles.network, styles[layout.growth])}
			style={{ "--settled": `${layout.settled}ms` } as CSSProperties}
			aria-hidden="true"
		>
			<g className={styles.hazes}>
				{layout.haze.map((stroke) => (
					<path
						key={stroke.d}
						d={plot(stroke.d)}
						pathLength={1}
						className={styles.haze}
						style={timing(stroke)}
					/>
				))}
			</g>
			<g className={cx(styles.filaments, active !== null && styles.dimmed)}>
				{layout.filaments.map((stroke) => (
					<path
						key={stroke.d}
						d={plot(stroke.d)}
						pathLength={1}
						className={styles.filament}
						style={timing(stroke)}
					/>
				))}
			</g>
			<g className={styles.glow}>
				{lit.map((route) => (
					<path
						key={route.d}
						d={plot(route.d)}
						pathLength={1}
						className={cx(styles.underlay, dimmed(route.serves))}
						style={timing(route)}
					/>
				))}
				{layout.routes.map((route) => (
					<path
						key={route.d}
						d={plot(route.d)}
						pathLength={1}
						className={cx(
							styles.route,
							styles[route.tone],
							styles[route.weight],
							dimmed(route.serves),
						)}
						style={timing(route)}
					/>
				))}
				{layout.routes.map((route) => (
					<path
						key={route.d}
						d={plot(route.d)}
						pathLength={1}
						className={styles.pulse}
						style={timing(route)}
					/>
				))}
			</g>
			{layout.nodes.map((node) => {
				const [x, y] = scalePoint(layout, node.at, size.width, size.height);
				return (
					<Diamond
						key={node.id}
						cx={x}
						cy={y}
						size={
							secondary.has(node.id)
								? SECONDARY_MARKER_SIZE
								: PRIMARY_MARKER_SIZE
						}
						className={cx(
							styles.marker,
							node.id === "changelog" && styles.hot,
							dimmed(node.serves),
						)}
						style={{ "--delay": `${node.delay}ms` } as CSSProperties}
					/>
				);
			})}
		</svg>
	);
}
