import summary from "@run-data/sample/experiment/summary.json";
import { comparisonWriteUp } from "./experimentData";

const name = "[Sample] [Experiment name]";

/**
 * A mock entry: every run behind it was invented by
 * scripts/run-data/gg-sample-runs.py, to show the write-up with enough runs to
 * fill every chart. gg 0.8.0 stands in for the build under test and gg 0.7.0
 * for the last build that shipped.
 */
export const sampleComparison = comparisonWriteUp(
	summary,
	() => import("@run-data/sample/experiment/experiment.json"),
	{
		slug: "sample-comparison",
		name,
		status: "shipped",
		outcome: "Shipped → gg 0.8.0",
		verdict:
			"[Sample. Two or three sentences: what we decided and why. Most readers stop here, so this has to stand on its own without the rest of the page.]",
		whatChanged: [
			"[A plain-language description of the change to gg's architecture, written for developers who use harnesses but haven't read gg's source.]",
			"[Any implementation detail that matters for interpreting the results, such as what stayed fixed between the two builds and what was tuned.]",
		],
		discussion: [
			"[Why we adopted it, or why it was meaningful enough to act on: the evidence against the last shipped build that justified the decision.]",
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
			"gg 0.8.0 and gg 0.7.0 source and config ↗",
		],
	},
);
