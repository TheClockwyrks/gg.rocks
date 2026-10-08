import { DataTable } from "@/components/DataTable/DataTable";
import { Figure } from "@/components/Figure/Figure";
import { writeUpDeltas } from "@/data/experiments";
import {
	baselineResult,
	experimentResult,
	harnessLabel,
	outcomes,
	type HarnessResult,
	type Measure,
	type WriteUpData,
} from "@/data/writeUps/types";
import {
	formatDollars,
	formatPercent,
	formatThousands,
	NO_DATA,
} from "@/utils/format";
import {
	ComparedAgainst,
	DataLinks,
	Lineage,
	Method,
	Prose,
	RatingColumns,
	Section,
	TokenBars,
} from "./blocks";
import { PassRateScatter } from "./PassRateScatter";
import { Verdict } from "./Verdict";
import { WriteUpFrame } from "./WriteUpFrame";

const toc = [
	{ id: "verdict", label: "Verdict" },
	{ id: "changed", label: "What changed" },
	{ id: "results", label: "Results" },
	{ id: "discussion", label: "Discussion" },
	{ id: "lineage", label: "Lineage" },
	{ id: "data", label: "Data" },
];

const TEMPLATE_NOTICE =
	"Template: this is the blank write-up. Bracketed text is what gets written for each experiment; the numbers and charts are drawn from dummy data.";

/** How a harness is named in tables and charts. */
function rowLabel(result: HarnessResult): string {
	return result.role === "experiment"
		? `This experiment · ${harnessLabel(result)}`
		: harnessLabel(result);
}

/** A figure with its spread, where one was measured. */
function withSpread(
	measure: Measure | null,
	format: (value: number) => string,
	digits: number,
): string {
	if (!measure) return NO_DATA;
	const value = format(measure.value);
	return measure.spread === undefined
		? value
		: `${value} ±${measure.spread.toFixed(digits)}`;
}

/** How many runs a harness's figures cover, and how many were scored. */
function runCount(result: HarnessResult): string {
	if (!result.runs) return NO_DATA;
	const { total, scored } = result.runs;
	return scored === total ? `${total}` : `${total} (${scored} scored)`;
}

/** How a harness is described in the "compared against" list. */
function comparisonLabel(result: HarnessResult): string {
	const detail = result.role === "baseline" ? "baseline" : result.snapshot;
	return detail ? `${harnessLabel(result)} · ${detail}` : harnessLabel(result);
}

/**
 * The standard experiment write-up. The frame and every figure are fixed; a
 * new experiment only supplies its data and prose (see `data/writeUps`).
 */
export function StandardWriteUp({ data }: { data: WriteUpData }) {
	const experiment = experimentResult(data);
	const baseline = baselineResult(data);
	const others = data.results.filter((result) => result !== experiment);
	const deltas = writeUpDeltas(data);
	const counted = data.results.some((result) => result.runs);
	const withTokens = data.results.filter(
		(result) => result.cachedShare !== null,
	);
	// Runs without a rating only get a legend entry when there are some.
	const legend = outcomes.filter(
		({ id }) =>
			id in experiment.functionality ||
			data.results.some((result) => (result.functionality[id] ?? 0) > 0),
	);

	return (
		<WriteUpFrame
			name={data.name}
			status={data.status}
			outcome={data.outcome}
			timeline={`${data.period} · tested on gg ${experiment.version}`}
			notice={data.template ? TEMPLATE_NOTICE : undefined}
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
						? `Deltas vs. ${harnessLabel(baseline)}. ${data.sample}`
						: `No earlier gg build to measure against yet. ${data.sample}`
				}
			/>

			<ComparedAgainst
				baselines={others.map(comparisonLabel)}
				note="Comparisons are snapshots from the dates shown. Other harnesses may have improved since."
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
				<Figure title="Headline numbers">
					<DataTable
						columns={[
							"Harness",
							...(counted ? ["Runs"] : []),
							"Pass rate",
							"Cost / run",
							"Tokens / run",
							"Cached share",
						]}
						rows={data.results.map((result) => ({
							key: result.id,
							tone: result.role === "experiment" ? "highlight" : "muted",
							cells: [
								rowLabel(result),
								...(counted ? [runCount(result)] : []),
								withSpread(result.passRate, formatPercent, 1),
								withSpread(result.costPerRun, formatDollars, 2),
								withSpread(result.tokensPerRun, formatThousands, 0),
								formatPercent(result.cachedShare, 0),
							],
						}))}
					/>
				</Figure>

				<Figure
					title="Pass rate vs. efficiency"
					legend={[
						{ label: "gg builds", swatch: "diamond", tone: "accent" },
						{ label: "Other harnesses", swatch: "dot", tone: "info" },
					]}
					note="Hover or focus a point for its exact values."
				>
					<PassRateScatter results={data.results} />
				</Figure>

				<Figure
					title="Where the tokens went"
					legend={[
						{ label: "Cached", swatch: "block", tone: "strand" },
						{ label: "Uncached", swatch: "block", tone: "accent" },
					]}
					note="Share of total tokens per run, averaged."
				>
					<TokenBars
						bars={withTokens.map((result) => ({
							label: rowLabel(result),
							cached: result.cachedShare ?? 0,
							highlight: result.role === "experiment",
						}))}
					/>
				</Figure>

				<Figure
					title="Functionality ratings"
					legend={legend.map(({ id, label }) => ({
						label,
						swatch: "block",
						tone: id,
					}))}
					note="Share of test runs given each functionality rating, stacked from Broken at the bottom to Flawless at the top."
				>
					<RatingColumns
						columns={data.results.map((result) => ({
							label: harnessLabel(result),
							counts: result.functionality,
							highlight: result.role === "experiment",
						}))}
					/>
				</Figure>
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
		</WriteUpFrame>
	);
}
