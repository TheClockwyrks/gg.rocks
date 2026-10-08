import { useState, type CSSProperties } from "react";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Diamond } from "@/components/Strand/Diamond";
import { harnessLabel, type HarnessResult } from "@/data/writeUps/types";
import { cx } from "@/utils/cx";
import { useElementSize } from "@/utils/useElementSize";
import {
	formatDollars,
	formatPercent,
	formatThousands,
	NO_DATA,
} from "@/utils/format";
import styles from "./charts.module.scss";

// --- What can go on the x axis ----------------------------------------------

interface XAxis {
	id: "cost" | "tokens" | "cache";
	label: string;
	title: string;
	/** Which way is better, to help read the chart. */
	hint: string;
	value: (result: HarnessResult) => number | null;
	format: (value: number) => string;
}

const xAxes: XAxis[] = [
	{
		id: "cost",
		label: "Cost",
		title: "cost per run",
		hint: "Up and to the left is better.",
		value: (result) => result.costPerRun?.value ?? null,
		format: formatDollars,
	},
	{
		id: "tokens",
		label: "Tokens",
		title: "tokens per run",
		hint: "Up and to the left is better.",
		value: (result) => result.tokensPerRun?.value ?? null,
		format: formatThousands,
	},
	{
		id: "cache",
		label: "Cached share",
		title: "cached share",
		hint: "Up and to the right is better.",
		value: (result) => result.cachedShare,
		format: (value) => formatPercent(value, 0),
	},
];

// --- Geometry ---------------------------------------------------------------

/** Below this width the chart tightens its margins and labels to fit. */
const COMPACT_BELOW = 560;
const TICK_COUNT = 4;
const HIT_RADIUS = 22;

interface Frame {
	width: number;
	height: number;
	compact: boolean;
	/** Edges of the plotting area. */
	left: number;
	right: number;
	top: number;
	bottom: number;
}

/** The chart is drawn at its real size, so text never shrinks with it. */
function frameFor(width: number): Frame {
	const compact = width < COMPACT_BELOW;
	const height = compact ? 340 : 400;
	return {
		width,
		height,
		compact,
		left: compact ? 40 : 64,
		right: width - (compact ? 24 : 32),
		top: 40,
		bottom: height - (compact ? 64 : 80),
	};
}

interface Scale {
	ticks: number[];
	position: (value: number) => number;
}

/** A linear scale over the data, padded and snapped to round tick values. */
function scale(values: number[], from: number, to: number): Scale {
	const low = Math.min(...values);
	const high = Math.max(...values);
	const padding = (high - low || 1) * 0.15;
	const rough = (high - low + padding * 2) / TICK_COUNT;
	const magnitude = 10 ** Math.floor(Math.log10(rough));
	const step =
		[1, 2, 2.5, 5, 10]
			.map((multiple) => multiple * magnitude)
			.find((candidate) => candidate >= rough) ?? rough;
	const min = Math.floor((low - padding) / step) * step;
	const max = Math.ceil((high + padding) / step) * step;
	const ticks: number[] = [];
	for (let tick = min; tick <= max + step / 2; tick += step) ticks.push(tick);
	const perUnit = (to - from) / (max - min);
	return {
		ticks,
		position: (value) => from + (value - min) * perUnit,
	};
}

// --- Labels -----------------------------------------------------------------

/** Approximate advance of one character of the monospace label, and its height. */
const LABEL_CHAR_WIDTH = 8;
const COMPACT_LABEL_CHAR_WIDTH = 6.8;
const LABEL_HEIGHT = 16;
const POINT_CLEARANCE = 12;

interface LabelPlacement {
	dx: number;
	dy: number;
	anchor: "start" | "middle" | "end";
}

/** Where a label may sit around its point, in order of preference. */
const labelPlacements: LabelPlacement[] = [
	{ dx: 16, dy: -10, anchor: "start" },
	{ dx: -16, dy: -10, anchor: "end" },
	{ dx: 16, dy: 22, anchor: "start" },
	{ dx: -16, dy: 22, anchor: "end" },
	{ dx: 0, dy: -18, anchor: "middle" },
	{ dx: 0, dy: 30, anchor: "middle" },
	{ dx: 0, dy: -34, anchor: "middle" },
	{ dx: 0, dy: 46, anchor: "middle" },
];

interface Box {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

const overlaps = (a: Box, b: Box): boolean =>
	a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

interface LabelledPoint {
	id: string;
	x: number;
	y: number;
	text: string;
}

/**
 * Chooses a side for each point's label so that labels stay inside the plot
 * and clear of other points and of labels already placed. Points earlier in
 * the list get first pick.
 */
function placeLabels(
	points: LabelledPoint[],
	frame: Frame,
): Map<string, LabelPlacement> {
	const charWidth = frame.compact ? COMPACT_LABEL_CHAR_WIDTH : LABEL_CHAR_WIDTH;
	const taken: Box[] = points.map((point) => ({
		left: point.x - POINT_CLEARANCE,
		right: point.x + POINT_CLEARANCE,
		top: point.y - POINT_CLEARANCE,
		bottom: point.y + POINT_CLEARANCE,
	}));
	const placed = new Map<string, LabelPlacement>();

	for (const point of points) {
		const width = point.text.length * charWidth;
		const boxFor = (placement: LabelPlacement): Box => {
			const start = point.x + placement.dx;
			const left =
				placement.anchor === "start"
					? start
					: placement.anchor === "end"
						? start - width
						: start - width / 2;
			const bottom = point.y + placement.dy + 4;
			return { left, right: left + width, top: bottom - LABEL_HEIGHT, bottom };
		};
		const inPlot = (box: Box) =>
			box.left >= frame.left &&
			box.right <= frame.width &&
			box.top >= 0 &&
			box.bottom <= frame.bottom;
		const choice =
			labelPlacements.find((placement) => {
				const box = boxFor(placement);
				return inPlot(box) && !taken.some((other) => overlaps(box, other));
			}) ??
			labelPlacements.find((placement) => inPlot(boxFor(placement))) ??
			labelPlacements[0]!;
		taken.push(boxFor(choice));
		placed.set(point.id, choice);
	}
	return placed;
}

/**
 * The label beside a point. Where space is tight other harnesses go by name
 * alone; their versions are in the table and the readout.
 */
function pointLabel(result: HarnessResult, frame: Frame): string {
	return frame.compact && result.role === "other"
		? result.name
		: harnessLabel(result);
}

function describe(result: HarnessResult): string {
	const spread = result.passRate?.spread;
	return [
		`pass rate ${formatPercent(result.passRate?.value)}${
			spread === undefined ? "" : ` ±${spread.toFixed(1)}`
		}`,
		`${formatDollars(result.costPerRun?.value)} per run`,
		`${formatThousands(result.tokensPerRun?.value)} tokens per run`,
		`${result.cachedShare ?? NO_DATA}% cached`,
	].join(" · ");
}

// --- Chart ------------------------------------------------------------------

/**
 * Pass rate for each harness against a cost-like measure the reader picks.
 * The dashed trail runs from the baseline gg build to the experiment.
 */
export function PassRateScatter({
	results: all,
}: {
	results: HarnessResult[];
}) {
	const [axisId, setAxisId] = useState<XAxis["id"]>("cost");
	const [activeId, setActiveId] = useState<string | null>(null);
	const [ref, size] = useElementSize<HTMLDivElement>();
	const axis = xAxes.find((candidate) => candidate.id === axisId) ?? xAxes[0]!;
	const frame = frameFor(size?.width ?? 0);

	// Only a harness with both figures has somewhere to sit on the chart.
	const results = all.filter(
		(result) => result.passRate !== null && axis.value(result) !== null,
	);
	const missing = all.filter((result) => !results.includes(result));

	const x = scale(
		results.map((result) => axis.value(result) ?? 0),
		frame.left,
		frame.right,
	);
	const y = scale(
		results.map((result) => result.passRate?.value ?? 0),
		frame.bottom,
		frame.top,
	);
	const at = (result: HarnessResult) => ({
		x: x.position(axis.value(result) ?? 0),
		y: y.position(result.passRate?.value ?? 0),
	});

	const experiment = results.find((result) => result.role === "experiment");
	const baseline = results.find((result) => result.role === "baseline");
	// The gg builds are the subject of the chart, so their labels go first.
	const labels = placeLabels(
		[...results]
			.sort((a, b) => Number(a.role === "other") - Number(b.role === "other"))
			.map((result) => ({
				id: result.id,
				...at(result),
				text: pointLabel(result, frame),
			})),
		frame,
	);
	const active =
		results.find((result) => result.id === activeId) ??
		experiment ??
		results[0];

	return (
		<>
			<div className={styles.toolbar}>
				<SegmentedControl
					label="Measure on the horizontal axis"
					options={xAxes}
					value={axisId}
					onChange={setAxisId}
					size="small"
				/>
				<span className={styles.hint}>{axis.hint}</span>
			</div>
			<div
				ref={ref}
				className={cx(styles.plot, frame.compact && styles.compact)}
			>
				{size && results.length > 0 && (
					<svg
						width={frame.width}
						height={frame.height}
						role="group"
						aria-label={`Scatter chart: pass rate against ${axis.title} for each harness`}
					>
						{y.ticks.map((tick) => (
							<g key={tick}>
								<line
									x1={frame.left}
									y1={y.position(tick)}
									x2={frame.right}
									y2={y.position(tick)}
									className={styles.gridLine}
								/>
								<text
									x={frame.left - 8}
									y={y.position(tick) + 4}
									textAnchor="end"
									className={styles.axisLabel}
								>
									{formatPercent(tick, 0)}
								</text>
							</g>
						))}
						{x.ticks.map((tick) => (
							<text
								key={tick}
								x={x.position(tick)}
								y={frame.bottom + 24}
								textAnchor="middle"
								className={styles.axisLabel}
							>
								{axis.format(tick)}
							</text>
						))}
						<line
							x1={frame.left}
							y1={frame.bottom}
							x2={frame.right}
							y2={frame.bottom}
							className={styles.axis}
						/>
						<text
							x={frame.right}
							y={frame.height - 12}
							textAnchor="end"
							className={styles.axisLabel}
						>
							{axis.title} →
						</text>
						<text
							x={0}
							y={16}
							className={styles.axisLabel}
						>
							↑ pass rate
						</text>

						{experiment && baseline && (
							<line
								// Redrawn (and so faded in again) whenever the axis changes.
								key={axisId}
								x1={at(baseline).x}
								y1={at(baseline).y}
								x2={at(experiment).x}
								y2={at(experiment).y}
								className={styles.trail}
							/>
						)}

						{results.map((result) => {
							const point = at(result);
							const label = labels.get(result.id) ?? labelPlacements[0]!;
							return (
								<g
									key={result.id}
									tabIndex={0}
									aria-label={`${harnessLabel(result)}: ${describe(result)}`}
									className={cx(
										styles.pointGroup,
										active?.id === result.id && styles.active,
									)}
									style={
										{
											transform: `translate(${point.x}px, ${point.y}px)`,
										} as CSSProperties
									}
									onMouseEnter={() => setActiveId(result.id)}
									onMouseLeave={() => setActiveId(null)}
									onFocus={() => setActiveId(result.id)}
									onBlur={() => setActiveId(null)}
								>
									<circle
										r={HIT_RADIUS}
										className={styles.hit}
									/>
									{result.role === "other" ? (
										<circle
											r={7}
											className={cx(styles.point, styles.other)}
										/>
									) : (
										<Diamond
											cx={0}
											cy={0}
											size={result.role === "experiment" ? 16 : 14}
											className={cx(
												styles.point,
												result.role === "experiment"
													? styles.current
													: styles.previous,
											)}
										/>
									)}
									<text
										x={label.dx}
										y={label.dy}
										textAnchor={label.anchor}
										className={cx(
											styles.pointLabel,
											result.role === "experiment" && styles.emphasis,
										)}
									>
										{pointLabel(result, frame)}
									</text>
								</g>
							);
						})}
					</svg>
				)}
			</div>
			{missing.length > 0 && (
				<p className={styles.hint}>
					No {axis.title} or pass rate yet for{" "}
					{missing.map(harnessLabel).join(", ")}.
				</p>
			)}
			{active && (
				<p
					className={styles.readout}
					aria-live="polite"
				>
					<span className={styles.readoutName}>{harnessLabel(active)}</span>
					{describe(active)}
				</p>
			)}
		</>
	);
}
