import { useEffect, useRef, useState, type ReactNode } from "react";
import { DataTable } from "@/components/DataTable/DataTable";
import { Figure, type LegendItem } from "@/components/Figure/Figure";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import {
	ALL_MODELS,
	scopeResults,
	seriesLabel,
	type ComparisonFile,
	type EndingId,
	type SubjectScope,
} from "@/data/runData";
import { harnessLabel, outcomes } from "@/data/writeUps/types";
import { formatThousands, NO_DATA } from "@/utils/format";
import { RatingColumns } from "./blocks";
import {
	CaseGrid,
	DifferencePlot,
	metrics,
	RunStrip,
	StackedBars,
	type Compared,
	type Metric,
} from "./comparisonCharts";
import styles from "./comparisonCharts.module.scss";
import { PassRateScatter } from "./PassRateScatter";

/** How runs ended, in the order their segments are stacked. */
const endings: { id: EndingId; label: string; tone: string }[] = [
	{ id: "completed", label: "Completed", tone: "strand" },
	{ id: "gaveUp", label: "Stopped without a working build", tone: "broken" },
	{ id: "ranOut", label: "Timed out, hung or hit a limit", tone: "accent" },
	{ id: "harnessError", label: "Harness error", tone: "subtle" },
];

const tokenClasses = [
	{ id: "cachedInputTokens", label: "Cached input", tone: "strand" },
	{ id: "uncachedInputTokens", label: "Uncached input", tone: "accent" },
	{ id: "outputTokens", label: "Output", tone: "info" },
] as const;

const percent = (value: number | null) =>
	value === null ? NO_DATA : `${Math.round(value * 100)}%`;

/** The wording that depends on what gg is being set against. */
interface Copy {
	/** How gg's own row is introduced, where it needs introducing. */
	subject?: string;
	difference: { title: string; hint: string; note: string };
	headline: string;
	scatter: { legend: LegendItem[]; note: string };
	spread: { legend: LegendItem[]; note: string };
	cases: string;
	ahead: string;
	behind: string;
}

const copies: Record<ResultFiguresProps["against"], Copy> = {
	// gg's current build against every other harness: the benchmarks.
	field: {
		difference: {
			title: "gg against each harness",
			hint: "on the runs they share",
			note: "Each row is gg minus that harness, averaged over the model and test case pairs both ran. To the right is better for gg whichever the measure. A pair is one model on one test case.",
		},
		headline:
			"gg's row covers every pair it ran. Each other row covers only the pairs that harness shares with gg, so rows are not comparable with one another, only with gg in the chart above. Great+ is the share of runs rated great or flawless.",
		scatter: {
			legend: [
				{ label: "gg", swatch: "diamond", tone: "accent" },
				{ label: "Other harnesses", swatch: "dot", tone: "info" },
			],
			note: "Hover or focus a point for its exact values. Pick a single model to hold the model fixed.",
		},
		spread: {
			legend: [
				{ label: "gg", swatch: "dot", tone: "accent" },
				{ label: "Other harnesses", swatch: "dot", tone: "info" },
			],
			note: "One dot per run. The shaded band holds the middle half of a harness's runs; hollow dots at zero are runs that did not finish. A narrow band means the harness scores the same from one run to the next.",
		},
		cases:
			"The gg column is gg's own figure on each test case. Every other column is gg minus that harness on the case; the stronger the colour, the wider the gap. A dash means the harness has no run of that case on a model gg ran.",
		ahead: "gg ahead",
		behind: "gg behind",
	},
	// A gg build under test against the last build that shipped: an experiment.
	baseline: {
		subject: "This experiment",
		difference: {
			title: "Change from the baseline",
			hint: "on the runs both builds share",
			note: "The row is this build minus the baseline, averaged over the model and test case pairs both ran. To the right is better whichever the measure. A pair is one model on one test case.",
		},
		headline:
			"This build's row covers every pair it ran; the baseline's covers the pairs the two share. Great+ is the share of runs rated great or flawless.",
		scatter: {
			legend: [
				{ label: "This experiment", swatch: "diamond", tone: "accent" },
				{ label: "Baseline", swatch: "diamond", tone: "subtle" },
			],
			note: "The dashed trail runs from the baseline to this build. Hover or focus a point for its exact values. Pick a single model to hold the model fixed.",
		},
		spread: {
			legend: [
				{ label: "This experiment", swatch: "dot", tone: "accent" },
				{ label: "Baseline", swatch: "dot", tone: "info" },
			],
			note: "One dot per run. The shaded band holds the middle half of a build's runs; hollow dots at zero are runs that did not finish. A narrow band means the build scores the same from one run to the next.",
		},
		cases:
			"The gg column is this build's own figure on each test case. The other column is this build minus the baseline on the case; the stronger the colour, the wider the gap. A dash means the baseline has no run of that case on a model this build ran.",
		ahead: "Better than the baseline",
		behind: "Worse than the baseline",
	},
};

interface MeasuredFigureProps {
	title: string;
	hint: string;
	legend: LegendItem[];
	note: string;
	children: (metric: Metric) => ReactNode;
}

/**
 * A figure that can show any one measure. It keeps its own choice, with the
 * control beside the chart it changes, so the reader never has to scroll back
 * to a shared one.
 */
function MeasuredFigure({
	title,
	hint,
	legend,
	note,
	children,
}: MeasuredFigureProps) {
	const [metricId, setMetricId] = useState(metrics[0]!.id);
	const metric = metrics.find((entry) => entry.id === metricId) ?? metrics[0]!;
	return (
		<Figure
			title={`${title}: ${metric.label.toLowerCase()}`}
			hint={hint}
			legend={legend}
			note={note}
		>
			<SegmentedControl
				label={`Measure shown in “${title}”`}
				options={metrics}
				value={metricId}
				onChange={setMetricId}
				size="small"
			/>
			{children(metric)}
		</Figure>
	);
}

interface ResultFiguresProps {
	file: ComparisonFile;
	/** What gg is set against, which decides how the figures are worded. */
	against: "field" | "baseline";
}

/**
 * Every figure drawn from a pull: gg against each other series in the file on
 * the runs they share, with a filter that limits them all to one model. The
 * benchmarks and the experiment write-ups draw the same figures; only what gg
 * is set against differs.
 */
export function ResultFigures({ file, against }: ResultFiguresProps) {
	const copy = copies[against];
	const [scope, setScope] = useState(ALL_MODELS);
	// Where the models do not all fit, keep the chosen one in view: it is the
	// only sign of what the figures are showing.
	const options = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const row = options.current;
		const chosen = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
		if (row && chosen)
			row.scrollTo({
				left: chosen.offsetLeft - (row.clientWidth - chosen.offsetWidth) / 2,
				behavior: "smooth",
			});
	}, [scope]);

	const [subject, ...others] = file.series;
	const own = file.subject.scopes[scope];
	const compared: Compared[] = others
		// A previous build that was never run has nothing to say.
		.filter((series) => series.role === "other" || series.runs > 0)
		.map((series) => {
			const comparison = file.comparisons.find(
				(entry) => entry.against === series.id,
			);
			return {
				series,
				reason: comparison?.reason ?? null,
				scope: comparison?.scopes[scope],
			};
		});
	const sharing = compared.filter((entry) => (entry.scope?.pairs ?? 0) > 0);
	const results = scopeResults(file, scope);
	const model = file.models.find((entry) => entry.id === scope);
	const where = model ? `on ${model.name}` : "across the models gg ran";

	const sides = [
		...(subject && own
			? [{ series: subject, side: own, figures: own.metrics, pairs: own.pairs }]
			: []),
		...sharing.flatMap(({ series, scope: shared }) =>
			shared
				? [
						{
							series,
							side: shared.other,
							figures: Object.fromEntries(
								Object.entries(shared.metrics).map(([id, paired]) => [
									id,
									paired.other,
								]),
							) as SubjectScope["metrics"],
							pairs: shared.pairs,
						},
					]
				: [],
		),
	];
	const mostTokens = Math.max(
		...sides.map(({ figures }) => figures.totalTokens ?? 0),
		1,
	);
	const shownRuns = file.runs.filter(
		(run) => scope === ALL_MODELS || run.model === scope,
	);
	const legend = outcomes.filter(({ id }) =>
		results.some((result) => (result.functionality[id] ?? 0) > 0),
	);

	return (
		<>
			<div className={styles.modelBar}>
				<span className={styles.modelBarLabel}>Model</span>
				<div
					ref={options}
					className={styles.modelBarOptions}
				>
					<SegmentedControl
						label="Model every figure in the results is limited to"
						options={[
							{ id: ALL_MODELS, label: "All models" },
							...file.models.map(({ id, name }) => ({ id, label: name })),
						]}
						value={scope}
						onChange={setScope}
						size="small"
					/>
				</div>
			</div>

			<MeasuredFigure
				title={copy.difference.title}
				hint={`${where}, ${copy.difference.hint}`}
				legend={[
					{ label: "Clear of zero", swatch: "dot", tone: "accent" },
					{ label: "Could be either way", swatch: "dot", tone: "subtle" },
					{ label: "95% interval", swatch: "line", tone: "subtle" },
				]}
				note={copy.difference.note}
			>
				{(metric) => (
					<DifferencePlot
						rows={compared}
						metric={metric}
					/>
				)}
			</MeasuredFigure>

			<Figure
				title="Headline numbers"
				note={copy.headline}
			>
				<DataTable
					columns={[
						"Harness",
						"Pairs",
						"Runs",
						...metrics.map((entry) => entry.short ?? entry.label),
					]}
					rows={sides.map(({ series, side, figures, pairs }) => ({
						key: series.id,
						tone: series.role === "subject" ? "highlight" : "muted",
						cells: [
							series.role === "subject" && copy.subject
								? `${copy.subject} · ${seriesLabel(series)}`
								: seriesLabel(series),
							`${pairs}`,
							`${side.runs}`,
							...metrics.map((entry) => entry.format(figures[entry.id])),
						],
					}))}
				/>
			</Figure>

			<Figure
				title="Pass rate vs. efficiency"
				hint={where}
				legend={copy.scatter.legend}
				note={copy.scatter.note}
			>
				<PassRateScatter results={results} />
			</Figure>

			<Figure
				title="Functionality ratings"
				hint={where}
				legend={legend.map(({ id, label }) => ({
					label,
					swatch: "block",
					tone: id,
				}))}
				note="Share of test runs given each functionality rating, stacked from Broken at the bottom to Flawless at the top."
			>
				<RatingColumns
					columns={results.map((result) => ({
						label: harnessLabel(result),
						counts: result.functionality,
						highlight: result.role === "subject",
					}))}
				/>
			</Figure>

			<Figure
				title="How runs ended"
				hint={where}
				legend={endings.map(({ label, tone }) => ({
					label,
					swatch: "block",
					tone: tone as "strand",
				}))}
				note="Share of runs. A run that did not complete scores a pass rate of zero."
			>
				<StackedBars
					stacks={sides.map(({ series, side }) => ({
						key: series.id,
						label: seriesLabel(series),
						value: `${percent(side.endings.completed)} completed`,
						highlight: series.role === "subject",
						length: 1,
						segments: endings.map(({ id, label, tone }) => ({
							tone,
							share: side.endings[id] ?? 0,
							title: `${label}: ${percent(side.endings[id])}`,
						})),
					}))}
				/>
			</Figure>

			<Figure
				title="Run-to-run spread"
				hint={`pass rate of every run, ${where}`}
				legend={[
					...copy.spread.legend,
					{ label: "Median", swatch: "line", tone: "subtle" },
				]}
				note={copy.spread.note}
			>
				<RunStrip
					series={file.series}
					runs={shownRuns}
				/>
			</Figure>

			<MeasuredFigure
				title="Case by case"
				hint={where}
				legend={[
					{ label: copy.ahead, swatch: "block", tone: "great" },
					{ label: copy.behind, swatch: "block", tone: "scuffed" },
				]}
				note={copy.cases}
			>
				{(metric) => (
					<CaseGrid
						file={file}
						scope={scope}
						metric={metric}
						columns={sharing}
					/>
				)}
			</MeasuredFigure>

			<Figure
				title="Where the tokens went"
				hint={`tokens per run, ${where}`}
				legend={tokenClasses.map(({ label, tone }) => ({
					label,
					swatch: "block",
					tone,
				}))}
				note="Bars are drawn to the same scale, so a longer bar is more tokens. Output includes reasoning."
			>
				<StackedBars
					stacks={sides
						.filter(({ figures }) => figures.totalTokens !== null)
						.map(({ series, figures }) => {
							const total = figures.totalTokens ?? 0;
							const cached = figures.cachedInputTokens;
							return {
								key: series.id,
								label: seriesLabel(series),
								value: `${formatThousands(total / 1000)} · ${percent(cached === null ? null : cached / total)} cached`,
								highlight: series.role === "subject",
								length: total / mostTokens,
								segments: tokenClasses.map(({ id, label, tone }) => ({
									tone,
									share: figures[id] ?? 0,
									title: `${label}: ${formatThousands((figures[id] ?? 0) / 1000)}`,
								})),
							};
						})}
				/>
			</Figure>
		</>
	);
}
