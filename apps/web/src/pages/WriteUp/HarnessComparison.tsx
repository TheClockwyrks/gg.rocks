import { DataTable } from "@/components/DataTable/DataTable";
import { Figure } from "@/components/Figure/Figure";
import { PlaceholderLink } from "@/components/PlaceholderLink/PlaceholderLink";
import { writeUpPath } from "@/data/experiments";
import {
	ComparedAgainst,
	DataLinks,
	Lineage,
	Method,
	Prose,
	Section,
	TokenBars,
} from "./blocks";
import { CostVsPassRate } from "./charts";
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

const harnessValues = ["[x%] ±[s]", "$[x] ±[s]", "[x]k ±[s]", "[x%]"];

const testCase = (key: string) => ({
	key,
	tone: "muted" as const,
	cells: [
		<PlaceholderLink>[test case] ↗</PlaceholderLink>,
		"[x%]",
		"[x%]",
		"[±x]",
		"[±x%]",
	],
});

/** Write-up for a shipped experiment: gg measured against other harnesses. */
export function HarnessComparison() {
	return (
		<WriteUpFrame
			name="[Experiment name]"
			status="shipped"
			outcome="Shipped → Vantacode [build]"
			timeline="[start date] – [end date] · tested on gg [build]"
			toc={toc}
		>
			<Verdict
				status="shipped"
				summary="[Two or three sentences: what we decided and why. Most readers stop here, so this has to stand on its own without the rest of the page.]"
				stats={[
					{ value: "[±x%]", label: "Pass rate" },
					{ value: "[±x%]", label: "Cost per run" },
					{ value: "[±x%]", label: "Tokens per run" },
					{ value: "[±x pts]", label: "Cached share" },
				]}
				basis="Deltas vs. gg [previous build]. Averages over [n] runs across [k] TTC test cases."
			/>

			<ComparedAgainst
				baselines={[
					"gg [previous build] · baseline",
					"[Harness A] [version] · runs from [Mon YYYY]",
					"[Harness B] [version] · runs from [Mon YYYY]",
				]}
				note="Comparisons are snapshots from the dates shown. Other harnesses may have improved since."
			/>

			<Section
				id="changed"
				title="What changed"
			>
				<Prose>
					[A plain-language description of the change to gg's architecture,
					written for developers who use harnesses but haven't read gg's
					source.]
				</Prose>
				<Prose>
					[Any implementation detail that matters for interpreting the results,
					such as what stayed fixed and what was tuned.]
				</Prose>
			</Section>

			<Section
				id="results"
				title="Results"
				lead={
					<Method>
						Averages over [n] runs across [k] TTC test cases. Ranges show
						[spread measure].
					</Method>
				}
				spacious
			>
				<Figure title="Headline numbers">
					<DataTable
						columns={[
							"Harness",
							"Pass rate",
							"Cost / run",
							"Tokens / run",
							"Cached share",
						]}
						rows={[
							{
								key: "experiment",
								tone: "highlight",
								cells: ["This experiment · gg [build]", ...harnessValues],
							},
							{
								key: "previous",
								tone: "muted",
								cells: ["gg [previous build]", ...harnessValues],
							},
							{
								key: "harness-a",
								tone: "muted",
								cells: ["[Harness A] [version]", ...harnessValues],
							},
							{
								key: "harness-b",
								tone: "muted",
								cells: ["[Harness B] [version]", ...harnessValues],
							},
						]}
					/>
				</Figure>

				<Figure
					title="Cost vs. pass rate"
					hint="Up and to the left is better."
					legend={[
						{ label: "gg builds", swatch: "diamond", tone: "accent" },
						{ label: "Other harnesses", swatch: "dot", tone: "info" },
					]}
					note="Illustrative positions. Hovering a point would show its exact values and run count; a table view sits behind a toggle."
				>
					<CostVsPassRate />
				</Figure>

				<Figure
					title="Where the tokens went"
					legend={[
						{ label: "Cached", swatch: "block", tone: "strand" },
						{ label: "Uncached", swatch: "block", tone: "accent" },
					]}
					note="Illustrative proportions. Share of total tokens per run, averaged."
				>
					<TokenBars
						bars={[
							{
								label: "gg [previous build]",
								cached: 40,
								value: "[x]% cached",
							},
							{
								label: "This experiment",
								cached: 62,
								value: "[x]% cached",
								highlight: true,
							},
						]}
					/>
				</Figure>

				<Figure
					title="By test case"
					note="Test case names link to their pages on The Test Cabinet."
				>
					<DataTable
						columns={[
							"Test case",
							"gg [prev] pass",
							"This exp. pass",
							"Δ pass",
							"Δ cost",
						]}
						rows={["case-1", "case-2", "case-3", "case-4"].map(testCase)}
					/>
				</Figure>
			</Section>

			<Section
				id="discussion"
				title="Discussion"
			>
				<Prose>
					[Why we kept it: which trade-offs mattered, what surprised us, and
					where the result is weaker than the headline suggests.]
				</Prose>
				<Prose>[Open questions and follow-up ideas.]</Prose>
			</Section>

			<Section
				id="lineage"
				title="Lineage"
			>
				<Lineage
					steps={[
						{
							relation: "Grew from · retired",
							name: "[Earlier experiment]",
							kind: "link",
							tone: "neutral",
							to: writeUpPath("design-change"),
						},
						{
							relation: "This experiment · shipped",
							name: "[Experiment name]",
							kind: "self",
							tone: "accent",
							lit: true,
						},
						{
							relation: "Led to · active",
							name: "[Follow-up experiment]",
							kind: "pending",
							tone: "neutral",
						},
					]}
				/>
			</Section>

			<Section
				id="data"
				title="Data"
			>
				<DataLinks
					links={[
						"Download aggregated results (CSV)",
						"The [n] runs on The Test Cabinet ↗",
						"TTC methodology ↗",
						"gg [build] source and config ↗",
					]}
				/>
			</Section>
		</WriteUpFrame>
	);
}
