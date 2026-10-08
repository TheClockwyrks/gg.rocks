import type { CSSProperties } from "react";
import { FigureScroll } from "@/components/Figure/Figure";
import {
	seriesLabel,
	type ComparisonScope,
	type ExperimentFile,
	type ExperimentRun,
	type MetricId,
	type PairedMetric,
	type Series,
} from "@/data/writeUps/experimentData";
import { cx } from "@/utils/cx";
import {
	formatChange,
	formatDollars,
	formatPercent,
	formatPoints,
	formatThousands,
	NO_DATA,
} from "@/utils/format";
import styles from "./comparisonCharts.module.scss";

// --- Metrics ----------------------------------------------------------------

export interface Metric {
	id: MetricId;
	label: string;
	/** For a column heading, where the label is too long for one. */
	short?: string;
	higherIsBetter: boolean;
	format: (value: number | null) => string;
	/** gg's figure against another's, as a signed difference. */
	difference: (subject: number | null, other: number | null) => string;
}

const share = (value: number | null) =>
	formatPercent(value === null ? null : value * 100);
const points = (subject: number | null, other: number | null) =>
	formatPoints(
		other === null ? null : other * 100,
		subject === null ? null : subject * 100,
	);
const change = (subject: number | null, other: number | null) =>
	formatChange(other, subject);

/** What gg can be compared on, in the order the reader is offered them. */
export const metrics: Metric[] = [
	{
		id: "passRate",
		label: "Pass rate",
		higherIsBetter: true,
		format: share,
		difference: points,
	},
	{
		id: "goodShare",
		label: "Great or flawless",
		short: "Great+",
		higherIsBetter: true,
		format: share,
		difference: points,
	},
	{
		id: "completionRate",
		label: "Completed",
		higherIsBetter: true,
		format: share,
		difference: points,
	},
	{
		id: "costUsd",
		label: "Cost",
		higherIsBetter: false,
		format: formatDollars,
		difference: change,
	},
	{
		id: "totalTokens",
		label: "Tokens",
		higherIsBetter: false,
		format: (value) => formatThousands(value === null ? null : value / 1000),
		difference: change,
	},
	{
		id: "durationSeconds",
		label: "Time",
		higherIsBetter: false,
		format: (value) =>
			value === null ? NO_DATA : `${(value / 60).toFixed(1)} min`,
		difference: change,
	},
];

const pairCount = (pairs: number) =>
	`${pairs} ${pairs === 1 ? "pair" : "pairs"}`;

const at = (percent: number): CSSProperties =>
	({ "--at": `${percent}%` }) as CSSProperties;

// --- Rows -------------------------------------------------------------------

interface RowProps {
	label: string;
	value: string;
	highlight?: boolean;
	children: React.ReactNode;
}

/** One labelled track in a set of comparable tracks, with a summary at its end. */
function Row({ label, value, highlight, children }: RowProps) {
	return (
		<div className={cx(styles.row, highlight && styles.highlight)}>
			<span className={styles.rowLabel}>{label}</span>
			<div className={styles.rowTrack}>{children}</div>
			<span className={styles.rowValue}>{value}</span>
		</div>
	);
}

/** Tick labels under the tracks of a set of rows. */
function Scale({ ticks }: { ticks: { at: number; label: string }[] }) {
	return (
		<div
			className={cx(styles.row, styles.scale)}
			aria-hidden="true"
		>
			<div className={styles.rowTrack}>
				{ticks.map((tick) => (
					<span
						key={tick.at}
						className={styles.tick}
						style={at(tick.at)}
					>
						{tick.label}
					</span>
				))}
			</div>
		</div>
	);
}

// --- Paired differences -----------------------------------------------------

export interface Compared {
	series: Series;
	reason: string | null;
	scope: ComparisonScope | undefined;
}

/**
 * gg minus each other series on the pairs they share, with the interval the
 * difference could plausibly lie in. Better for gg is always to the right, so
 * a lower cost plots on the same side as a higher pass rate.
 */
export function DifferencePlot({
	rows,
	metric,
}: {
	rows: Compared[];
	metric: Metric;
}) {
	const direction = metric.higherIsBetter ? 1 : -1;
	const measured = rows.flatMap(({ scope }) => {
		const paired = scope?.metrics[metric.id];
		return paired?.delta == null ? [] : [paired];
	});
	const reach =
		Math.max(
			...measured.flatMap((paired) =>
				[paired.delta, paired.low, paired.high].map((value) =>
					Math.abs(value ?? 0),
				),
			),
			0,
		) * 1.15 || 1;
	const position = (value: number) => 50 + ((direction * value) / reach) * 50;
	// A difference in the metric's own unit, signed: points for a share.
	const absolute = (value: number) =>
		metric.difference === points
			? points(value, 0)
			: `${value < 0 ? "−" : "+"}${metric.format(Math.abs(value))}`;

	return (
		<div className={styles.rows}>
			{rows.map(({ series, reason, scope }) => {
				const paired: PairedMetric | undefined = scope?.metrics[metric.id];
				if (!paired || paired.delta === null) {
					return (
						<Row
							key={series.id}
							label={`vs ${seriesLabel(series)}`}
							value={NO_DATA}
						>
							<span className={styles.empty}>
								{reason ?? "no shared runs for this model"}
							</span>
						</Row>
					);
				}
				const { delta, low, high } = paired;
				const clear = low != null && high != null && (low > 0 || high < 0);
				const ends =
					low != null && high != null
						? [position(low), position(high)].sort((a, b) => a - b)
						: null;
				return (
					<Row
						key={series.id}
						label={`vs ${seriesLabel(series)}`}
						value={`${metric.difference(paired.subject, paired.other)} · ${pairCount(paired.pairs)}`}
					>
						<div
							className={styles.difference}
							title={`gg ${metric.format(paired.subject)} vs ${metric.format(paired.other)} on ${pairCount(paired.pairs)}${
								ends
									? `; the difference is between ${absolute(low ?? 0)} and ${absolute(high ?? 0)}`
									: "; too few pairs for an interval"
							}`}
						>
							<span className={styles.zero} />
							{ends && (
								<span
									className={styles.whisker}
									style={
										{
											"--from": `${ends[0]}%`,
											"--to": `${ends[1]}%`,
										} as CSSProperties
									}
								/>
							)}
							<span
								className={cx(styles.estimate, clear && styles.clear)}
								style={at(position(delta))}
							/>
						</div>
					</Row>
				);
			})}
			<Scale
				ticks={[
					{ at: 0, label: `gg worse · ${absolute(-direction * reach)}` },
					{ at: 50, label: "0" },
					{ at: 100, label: `${absolute(direction * reach)} · gg better` },
				]}
			/>
		</div>
	);
}

// --- Stacked bars -----------------------------------------------------------

export interface Stack {
	key: string;
	label: string;
	value: string;
	highlight?: boolean;
	/** How much of the track the whole bar fills, 0-1. */
	length: number;
	segments: { tone: string; share: number; title: string }[];
}

/** One bar per series, split into segments, on a common scale. */
export function StackedBars({ stacks }: { stacks: Stack[] }) {
	return (
		<div className={styles.rows}>
			{stacks.map((stack) => (
				<Row
					key={stack.key}
					label={stack.label}
					value={stack.value}
					highlight={stack.highlight}
				>
					<div
						className={styles.stack}
						style={{ width: `${stack.length * 100}%` }}
					>
						{stack.segments
							.filter((segment) => segment.share > 0)
							.map((segment) => (
								<span
									key={segment.tone}
									className={cx(styles.segment, styles[segment.tone])}
									style={{ flexGrow: segment.share }}
									title={segment.title}
								/>
							))}
					</div>
				</Row>
			))}
		</div>
	);
}

// --- Run-to-run spread ------------------------------------------------------

const quantile = (sorted: number[], q: number): number => {
	const index = (sorted.length - 1) * q;
	const below = sorted[Math.floor(index)] ?? 0;
	const above = sorted[Math.ceil(index)] ?? below;
	return below + (above - below) * (index - Math.floor(index));
};

/** A repeatable scatter of dots across the height of a row. */
const jitter = (index: number) => 15 + ((index * 61.8) % 70);

/**
 * Every run as a dot on its pass rate, one row per series, so that a harness
 * that scores the same every time can be told from one that averages the same.
 */
export function RunStrip({
	series,
	runs,
}: {
	series: Series[];
	runs: ExperimentRun[];
}) {
	return (
		<div className={styles.rows}>
			{series.map((entry) => {
				const scored = runs.filter(
					(run) => run.series === entry.id && run.passRate !== null,
				);
				if (scored.length === 0) return null;
				const sorted = scored
					.map((run) => (run.passRate ?? 0) * 100)
					.sort((a, b) => a - b);
				const median = quantile(sorted, 0.5);
				const low = quantile(sorted, 0.25);
				const high = quantile(sorted, 0.75);
				return (
					<Row
						key={entry.id}
						label={seriesLabel(entry)}
						value={`middle half ${low.toFixed(0)}–${high.toFixed(0)}%`}
						highlight={entry.role === "experiment"}
					>
						<div
							className={styles.strip}
							role="img"
							aria-label={`${seriesLabel(entry)}: ${scored.length} runs, median pass rate ${median.toFixed(0)}%, middle half ${low.toFixed(0)} to ${high.toFixed(0)}%`}
						>
							<span
								className={styles.middleHalf}
								style={
									{ "--from": `${low}%`, "--to": `${high}%` } as CSSProperties
								}
							/>
							{scored.map((run, index) => (
								<span
									key={index}
									className={cx(
										styles.run,
										run.category === "didNotFinish" && styles.failed,
										entry.role === "experiment" && styles.current,
									)}
									style={
										{
											"--at": `${(run.passRate ?? 0) * 100}%`,
											"--down": `${jitter(index)}%`,
										} as CSSProperties
									}
								/>
							))}
							<span
								className={styles.median}
								style={at(median)}
							/>
						</div>
					</Row>
				);
			})}
			<Scale
				ticks={[0, 25, 50, 75, 100].map((tick) => ({
					at: tick,
					label: `${tick}%`,
				}))}
			/>
		</div>
	);
}

// --- Case by case -----------------------------------------------------------

/**
 * gg's figure on each test case, and beside it how far ahead of or behind
 * each other series gg is on that case. Blue is gg ahead, red gg behind, and
 * the stronger the colour the larger the gap.
 */
export function CaseGrid({
	file,
	scope,
	metric,
	columns,
}: {
	file: ExperimentFile;
	scope: string;
	metric: Metric;
	columns: Compared[];
}) {
	const own = file.subject.scopes[scope];
	const cases = file.cases.filter((entry) =>
		own?.cases.some((row) => row.case === entry.id),
	);
	const cell = (compared: Compared, id: string) =>
		compared.scope?.cases.find((row) => row.case === id)?.metrics[metric.id];
	const direction = metric.higherIsBetter ? 1 : -1;
	// Costs differ by multiples between models, so they are shaded by their
	// relative gap; shares are shaded by the gap in points.
	const gap = (paired: PairedMetric | undefined): number | null => {
		if (!paired || paired.delta === null) return null;
		const relative = metric.difference === change && paired.other;
		return direction * (relative ? paired.delta / relative : paired.delta);
	};
	const widest =
		Math.max(
			...columns.flatMap((compared) =>
				cases.map((entry) => Math.abs(gap(cell(compared, entry.id)) ?? 0)),
			),
			0,
		) || 1;

	return (
		<FigureScroll wide>
			<table className={styles.grid}>
				<thead>
					<tr>
						<th scope="col">Test case</th>
						<th scope="col">gg</th>
						{columns.map(({ series }) => (
							<th
								key={series.id}
								scope="col"
							>
								vs{" "}
								{series.role === "baseline"
									? seriesLabel(series)
									: series.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{cases.map((entry) => (
						<tr key={entry.id}>
							<th scope="row">{entry.label}</th>
							<td>
								{metric.format(
									own?.cases.find((row) => row.case === entry.id)?.metrics[
										metric.id
									] ?? null,
								)}
							</td>
							{columns.map((compared) => {
								const paired = cell(compared, entry.id);
								const size = gap(paired);
								if (!paired || size === null)
									return (
										<td
											key={compared.series.id}
											className={styles.blank}
										>
											{NO_DATA}
										</td>
									);
								return (
									<td
										key={compared.series.id}
										className={cx(
											styles.gap,
											size > 0 ? styles.ahead : size < 0 && styles.behind,
										)}
										style={
											{
												"--strength": `${Math.round((Math.abs(size) / widest) * 80)}%`,
											} as CSSProperties
										}
										title={`gg ${metric.format(paired.subject)} vs ${seriesLabel(compared.series)} ${metric.format(paired.other)}, on ${pairCount(paired.pairs)}`}
									>
										{metric.difference(paired.subject, paired.other)}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</FigureScroll>
	);
}

// --- Version by version -----------------------------------------------------

const trendMetrics: MetricId[] = [
	"passRate",
	"goodShare",
	"costUsd",
	"durationSeconds",
];

/**
 * gg from one version to the next: a small chart per metric, each on its own
 * scale, with the build under test picked out.
 */
export function VersionTrend({
	trend,
	current,
}: {
	trend: ExperimentFile["trend"];
	current: string | null;
}) {
	const { versions } = trend;
	const across = (index: number) => ((index + 0.5) / versions.length) * 100;

	return (
		<div className={styles.panels}>
			{trendMetrics.map((id) => {
				const metric = metrics.find((candidate) => candidate.id === id);
				if (!metric) return null;
				const values = versions.map((version) => version.metrics[id]);
				const known = values.filter((value) => value !== null);
				const low = Math.min(...known);
				const high = Math.max(...known);
				// Leave room above for the value labels and below for the baseline.
				const down = (value: number) =>
					high === low ? 50 : 78 - ((value - low) / (high - low)) * 50;
				return (
					<div
						key={id}
						className={styles.panel}
					>
						<span className={styles.panelTitle}>
							{metric.label}
							<span className={styles.panelHint}>
								{metric.higherIsBetter ? "higher is better" : "lower is better"}
							</span>
						</span>
						<div className={styles.panelPlot}>
							<svg
								viewBox="0 0 100 100"
								preserveAspectRatio="none"
								className={styles.panelLine}
								aria-hidden="true"
							>
								<polyline
									points={values
										.flatMap((value, index) =>
											value === null ? [] : [`${across(index)},${down(value)}`],
										)
										.join(" ")}
								/>
							</svg>
							{values.map((value, index) => {
								const version = versions[index];
								if (value === null || !version) return null;
								return (
									<span
										key={version.version}
										className={cx(
											styles.panelPoint,
											version.version === current && styles.current,
										)}
										style={
											{
												"--at": `${across(index)}%`,
												"--down": `${down(value)}%`,
											} as CSSProperties
										}
									>
										<span className={styles.panelValue}>
											{metric.format(value)}
										</span>
									</span>
								);
							})}
						</div>
						<div className={styles.panelAxis}>
							{versions.map((version) => (
								<span
									key={version.version}
									className={cx(version.version === current && styles.current)}
								>
									{version.version}
								</span>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}
