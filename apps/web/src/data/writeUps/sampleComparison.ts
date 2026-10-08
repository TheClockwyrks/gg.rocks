import file from "@run-data/sample/experiment.json";
import { comparisonWriteUp, type ExperimentFile } from "./experimentData";

const name = "[Sample] gg 0.8.0 against the field";

/**
 * A mock entry: every run behind it was invented by
 * scripts/gg-experiment-sample.py, to show the comparison layout with enough
 * runs to fill every chart.
 */
export const sampleComparison = comparisonWriteUp(
	file as unknown as ExperimentFile,
	{
		slug: "sample-comparison",
		name,
		status: "shipped",
		outcome: "Shipped → gg 0.8.0",
		verdict:
			"[Sample. Two or three sentences: what we decided and why. Most readers stop here, so this has to stand on its own without the rest of the page.]",
		whatChanged: [
			"[A plain-language description of the change to gg's architecture, written for developers who use harnesses but haven't read gg's source.]",
			"[Any implementation detail that matters for interpreting the results, such as what stayed fixed and what was tuned.]",
		],
		discussion: [
			"[Why we adopted it, or why it was meaningful enough to act on: the evidence that justified the decision.]",
			"[Optional: anything else the author wants to raise, such as surprises, caveats or follow-up ideas.]",
		],
		lineage: [
			{
				relation: "Grew from · shipped",
				name: "[Earlier experiment]",
				kind: "pending",
				tone: "neutral",
			},
			{
				relation: "This experiment · shipped",
				name,
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
		],
		dataLinks: [
			"Download aggregated results (CSV)",
			"The runs on The Test Cabinet ↗",
			"TTC methodology ↗",
			"gg 0.8.0 source and config ↗",
		],
	},
);
