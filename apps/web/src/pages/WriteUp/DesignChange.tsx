import { Figure } from "@/components/Figure/Figure";
import { writeUpPath } from "@/data/experiments";
import { BeforeAfter, DataLinks, Lineage, Prose, Section } from "./blocks";
import { MetricByVariable } from "./charts";
import { Verdict } from "./Verdict";
import { WriteUpFrame } from "./WriteUpFrame";

const toc = [
	{ id: "verdict", label: "Verdict" },
	{ id: "changed", label: "What changed" },
	{ id: "results", label: "Results" },
	{ id: "discussion", label: "Discussion" },
	{ id: "lineage", label: "Lineage & data" },
];

/** Write-up for a retired experiment: a change to gg's design. */
export function DesignChange() {
	return (
		<WriteUpFrame
			name="[Experiment name]"
			status="retired"
			outcome="Retired"
			timeline="[start date] – [end date] · tested on gg [build]"
			toc={toc}
		>
			<Verdict
				status="retired"
				summary="[Two or three sentences: why we retired it. What it was meant to improve, what it actually did, and the trade-off that decided it.]"
				stats={[
					{ value: "[±x%]", label: "[The metric this experiment targeted]" },
					{ value: "[±x%]", label: "Cost per run" },
				]}
				basis="Compared against gg [previous build] only. Averages over [n] runs on [k] selected test cases."
			/>

			<Section
				id="changed"
				title="What changed"
			>
				<Prose>
					[What part of gg's design this touched and why we thought it would
					help.]
				</Prose>
				<BeforeAfter
					variants={[
						{
							label: "Before · gg [previous build]",
							steps: [
								{ label: "[Component]" },
								{ label: "[Component being changed]" },
								{ label: "[Component]" },
								{ label: "[Component]" },
							],
						},
						{
							label: "After · this experiment",
							current: true,
							steps: [
								{ label: "[Component]" },
								{ label: "[Changed component]", change: "changed" },
								{ label: "[New step]", change: "added" },
								{ label: "[Component]" },
							],
						},
					]}
				/>
			</Section>

			<Section
				id="results"
				title="Results"
				lead={
					<Prose>
						[Prose that walks through what we measured. Design experiments can
						use whatever figures explain them best; this one uses a single
						annotated chart.]
					</Prose>
				}
				spacious
			>
				<Figure
					title="[Metric] by [variable]"
					legend={[
						{ label: "gg [previous build]", swatch: "line", tone: "subtle" },
						{ label: "This experiment", swatch: "line", tone: "accent" },
					]}
					note="Illustrative shape. Hover shows values at each point; a table view sits behind a toggle."
				>
					<MetricByVariable />
				</Figure>
			</Section>

			<Section
				id="discussion"
				title="Discussion"
			>
				<Prose>
					[Why it was retired, what we learned, and what it suggests trying
					next.]
				</Prose>
			</Section>

			<Section
				id="lineage"
				title="Lineage & data"
			>
				<Lineage
					steps={[
						{
							relation: "This experiment · retired",
							name: "[Experiment name]",
							kind: "self",
							tone: "dashed",
							lit: true,
						},
						{
							relation: "Led to · shipped",
							name: "[Follow-up experiment]",
							kind: "link",
							tone: "accent",
							to: writeUpPath("shared-prefix-fan-out"),
						},
					]}
				/>
				<DataLinks
					links={[
						"Download aggregated results (CSV)",
						"The [n] runs on The Test Cabinet ↗",
						"gg [build] source and config ↗",
					]}
				/>
			</Section>
		</WriteUpFrame>
	);
}
