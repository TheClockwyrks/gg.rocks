import { useState, type CSSProperties } from "react";
import { FigureScroll } from "@/components/Figure/Figure";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Diamond } from "@/components/Strand/Diamond";
import { harnessLabel, type HarnessResult } from "@/data/writeUps/types";
import { cx } from "@/utils/cx";
import { formatDollars, formatPercent, formatThousands } from "@/utils/format";
import styles from "./charts.module.scss";

// --- What can go on the x axis ----------------------------------------------

interface XAxis {
	id: "cost" | "tokens" | "cache";
	label: string;
	title: string;
	/** Which way is better, to help read the chart. */
	hint: string;
	value: (result: HarnessResult) => number;
	format: (value: number) => string;
}

const xAxes: XAxis[] = [
	{
		id: "cost",
		label: "Cost",
		title: "cost per run",
		hint: "Up and to the left is better.",
		value: (result) => result.costPerRun.value,
		format: formatDollars,
	},
	{
		id: "tokens",
		label: "Tokens",
		title: "tokens per run",
		hint: "Up and to the left is better.",
		value: (result) => result.tokensPerRun.value,
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

const WIDTH = 1040;
const HEIGHT = 400;
const PLOT = { left: 96, right: 1000, top: 40, bottom: 320 };
const TICK_COUNT = 4;
const HIT_RADIUS = 22;

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
const LABEL_HEIGHT = 16;
const POINT_CLEARANCE = 12;

interface LabelPlacement {
	dx: number;
	dy: number;
	anchor: "start" | "end";
}

/** Where a label may sit around its point, in order of preference. */
const labelPlacements: LabelPlacement[] = [
	{ dx: 18, dy: -10, anchor: "start" },
	{ dx: -18, dy: -10, anchor: "end" },
	{ dx: 18, dy: 22, anchor: "start" },
	{ dx: -18, dy: 22, anchor: "end" },
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
function placeLabels(points: LabelledPoint[]): Map<string, LabelPlacement> {
	const taken: Box[] = points.map((point) => ({
		left: point.x - POINT_CLEARANCE,
		right: point.x + POINT_CLEARANCE,
		top: point.y - POINT_CLEARANCE,
		bottom: point.y + POINT_CLEARANCE,
	}));
	const placed = new Map<string, LabelPlacement>();

	for (const point of points) {
		const width = point.text.length * LABEL_CHAR_WIDTH;
		const boxFor = (placement: LabelPlacement): Box => {
			const start = point.x + placement.dx;
			const left = placement.anchor === "start" ? start : start - width;
			const bottom = point.y + placement.dy + 4;
			return { left, right: left + width, top: bottom - LABEL_HEIGHT, bottom };
		};
		const inPlot = (box: Box) => box.left >= PLOT.left && box.right <= WIDTH;
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

function describe(result: HarnessResult): string {
	return [
		`pass rate ${formatPercent(result.passRate.value)} ±${result.passRate.spread.toFixed(1)}`,
		`${formatDollars(result.costPerRun.value)} per run`,
		`${formatThousands(result.tokensPerRun.value)} tokens per run`,
		`${result.cachedShare}% cached`,
	].join(" · ");
}

// --- Chart ------------------------------------------------------------------

/**
 * Pass rate for each harness against a cost-like measure the reader picks.
 * The dashed trail runs from the baseline gg build to the experiment.
 */
export function PassRateScatter({ results }: { results: HarnessResult[] }) {
	const [axisId, setAxisId] = useState<XAxis["id"]>("cost");
	const [activeId, setActiveId] = useState<string | null>(null);
	const axis = xAxes.find((candidate) => candidate.id === axisId) ?? xAxes[0]!;

	const x = scale(results.map(axis.value), PLOT.left, PLOT.right);
	const y = scale(
		results.map((result) => result.passRate.value),
		PLOT.bottom,
		PLOT.top,
	);
	const at = (result: HarnessResult) => ({
		x: x.position(axis.value(result)),
		y: y.position(result.passRate.value),
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
				text: harnessLabel(result),
			})),
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
			<FigureScroll wide>
				<svg
					viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
					role="group"
					aria-label={`Scatter chart: pass rate against ${axis.title} for each harness`}
					className={styles.chart}
				>
					{y.ticks.map((tick) => (
						<g key={tick}>
							<line
								x1={PLOT.left}
								y1={y.position(tick)}
								x2={PLOT.right}
								y2={y.position(tick)}
								className={styles.gridLine}
							/>
							<text
								x={PLOT.left - 12}
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
							y={PLOT.bottom + 24}
							textAnchor="middle"
							className={styles.axisLabel}
						>
							{axis.format(tick)}
						</text>
					))}
					<line
						x1={PLOT.left}
						y1={PLOT.bottom}
						x2={PLOT.right}
						y2={PLOT.bottom}
						className={styles.axis}
					/>
					<text
						x={PLOT.right}
						y={HEIGHT - 16}
						textAnchor="end"
						className={styles.axisLabel}
					>
						{axis.title} →
					</text>
					<text
						x={PLOT.left - 12}
						y={16}
						textAnchor="end"
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
									{harnessLabel(result)}
								</text>
							</g>
						);
					})}
				</svg>
			</FigureScroll>
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
