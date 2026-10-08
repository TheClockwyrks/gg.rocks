import { useEffect, useRef, useState, type ReactNode } from "react";
import { DataTable } from "@/components/DataTable/DataTable";
import { Figure, type LegendItem } from "@/components/Figure/Figure";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { writeUpDeltas } from "@/data/experiments";
import {
	ALL_MODELS,
	scopeResults,
	seriesLabel,
	type EndingId,
	type ExperimentFile,
	type SubjectScope,
} from "@/data/writeUps/experimentData";
import {
	baselineResult,
	experimentResult,
	harnessLabel,
	outcomes,
	type WriteUpData,
} from "@/data/writeUps/types";
import { formatThousands, NO_DATA } from "@/utils/format";
import {
	ComparedAgainst,
	DataLinks,
	Lineage,
	Method,
	Prose,
	RatingColumns,
	Section,
} from "./blocks";
import {
	CaseGrid,
	DifferencePlot,
	metrics,
	RunStrip,
	StackedBars,
	VersionTrend,
	type Compared,
	type Metric,
} from "./comparisonCharts";
import styles from "./comparisonCharts.module.scss";
import { PassRateScatter } from "./PassRateScatter";
import { Verdict } from "./Verdict";
import { WriteUpFrame } from "./WriteUpFrame";

const toc = [
	{ id: "verdict", label: "Verdict" },
	{ id: "changed", label: "What changed" },
	{ id: "results", label: "Results" },
	{ id: "versions", label: "Versions" },
	{ id: "discussion", label: "Discussion" },
	{ id: "lineage", label: "Lineage" },
	{ id: "data", label: "Data" },
];

const SAMPLE_NOTICE =
	"Sample data: every run behind this page was invented, to show the layout with enough runs to fill each chart. Bracketed text is what gets written for each experiment.";

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

/**
 * The experiment write-up: gg against each harness on the runs they share.
 * The frame and every figure are fixed; a new experiment supplies its pull
 * and prose (see `data/writeUps`). The verdict is drawn at once from the
 * summary, and the rest once the pull behind the charts has been fetched.
 */
export function ComparisonWriteUp({ data }: { data: WriteUpData }) {
	const [file, setFile] = useState<ExperimentFile | null>(null);
	const [failed, setFailed] = useState(false);
	useEffect(() => {
		let current = true;
		data.load().then(
			(loaded) => current && setFile(loaded),
			() => current && setFailed(true),
		);
		return () => {
			current = false;
		};
	}, [data]);

	const baseline = baselineResult(data);
	const deltas = writeUpDeltas(data);

	return (
		<WriteUpFrame
			name={data.name}
			status={data.status}
			outcome={data.outcome}
			timeline={`${data.period} · tested on gg ${experimentResult(data).version ?? NO_DATA}`}
			notice={data.synthetic ? SAMPLE_NOTICE : undefined}
			toc={toc}
		>
			<Verdict
				status={data.status}
				summary={data.verdict}
				stats={[
					{ value: deltas.passRate, label: "Pass rate" },
					{ value: deltas.cost, label: "Cost per run" },
					{ value: deltas.tokens, label: "Tokens per run" },
					{ value: deltas.cacheHit, label: "Cached share" },
				]}
				basis={
					baseline
						? `Deltas vs. ${harnessLabel(baseline)}, on the runs both builds share. ${data.sample}`
						: `No earlier gg build to measure against yet. ${data.sample}`
				}
			/>
			{file ? (
				<Sections
					data={data}
					file={file}
				/>
			) : (
				<Method>
					{failed
						? "The runs behind this page could not be loaded."
						: "Loading the runs behind this page…"}
				</Method>
			)}
		</WriteUpFrame>
	);
}

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

/** Everything below the verdict, which needs the full pull. */
function Sections({ data, file }: { data: WriteUpData; file: ExperimentFile }) {
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
			<ComparedAgainst
				baselines={others
					.filter((series) => series.runs > 0)
					.map((series) =>
						series.role === "baseline"
							? `${seriesLabel(series)} · baseline`
							: `${seriesLabel(series)} · ${series.runs} runs`,
					)}
				note="Comparisons are snapshots from the date of the pull. Other harnesses may have improved since."
			/>

			<Section
				id="changed"
				title="What changed"
			>
				{data.whatChanged.map((paragraph) => (
					<Prose key={paragraph}>{paragraph}</Prose>
				))}
			</Section>

			<Section
				id="results"
				title="Results"
				lead={
					<Method>
						{data.sample} {data.spread}
					</Method>
				}
				spacious
			>
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
					title="gg against each harness"
					hint={`${where}, on the runs they share`}
					legend={[
						{ label: "Clear of zero", swatch: "dot", tone: "accent" },
						{ label: "Could be either way", swatch: "dot", tone: "subtle" },
						{ label: "95% interval", swatch: "line", tone: "subtle" },
					]}
					note="Each row is gg minus that harness, averaged over the model and test case pairs both ran. To the right is better for gg whichever the measure. A pair is one model on one test case."
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
					note="gg's row covers every pair it ran. Each other row covers only the pairs that harness shares with gg, so rows are not comparable with one another, only with gg in the chart above. Great+ is the share of runs rated great or flawless."
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
							tone: series.role === "experiment" ? "highlight" : "muted",
							cells: [
								series.role === "experiment"
									? `This experiment · ${seriesLabel(series)}`
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
					legend={[
						{ label: "gg builds", swatch: "diamond", tone: "accent" },
						{ label: "Other harnesses", swatch: "dot", tone: "info" },
					]}
					note="Hover or focus a point for its exact values. Pick a single model to hold the model fixed."
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
							highlight: result.role === "experiment",
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
							highlight: series.role === "experiment",
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
						{ label: "This experiment", swatch: "dot", tone: "accent" },
						{
							label: "Other builds and harnesses",
							swatch: "dot",
							tone: "info",
						},
						{ label: "Median", swatch: "line", tone: "subtle" },
					]}
					note="One dot per run. The shaded band holds the middle half of a harness's runs; hollow dots at zero are runs that did not finish. A narrow band means the harness scores the same from one run to the next."
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
						{ label: "gg ahead", swatch: "block", tone: "great" },
						{ label: "gg behind", swatch: "block", tone: "scuffed" },
					]}
					note="The gg column is gg's own figure on each test case. Every other column is gg minus that harness on the case; the stronger the colour, the wider the gap. A dash means the harness has no run of that case on a model gg ran."
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
									highlight: series.role === "experiment",
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
			</Section>

			<Section
				id="versions"
				title="Version by version"
				lead={
					<Method>
						{file.trend.basis === "shared"
							? "Every gg version on the model and test case pairs all of them ran, so the line moves only when gg does."
							: "No pair was run by every gg version, so each version is averaged over its own runs and the line also reflects what each was run on."}
					</Method>
				}
			>
				<VersionTrend
					trend={file.trend}
					current={file.meta.currentVersion}
				/>
			</Section>

			<Section
				id="discussion"
				title="Discussion"
			>
				{data.discussion.map((paragraph) => (
					<Prose key={paragraph}>{paragraph}</Prose>
				))}
			</Section>

			<Section
				id="lineage"
				title="Lineage"
			>
				<Lineage steps={data.lineage} />
			</Section>

			<Section
				id="data"
				title="Data"
			>
				<DataLinks links={data.dataLinks} />
			</Section>
		</>
	);
}
