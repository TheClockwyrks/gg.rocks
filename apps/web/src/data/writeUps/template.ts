import type { WriteUpData } from "./types";

/**
 * The blank slate. Copy this file for a new experiment, replace the bracketed
 * placeholders, and swap the dummy results for the real Test Cabinet numbers.
 */
export const template: WriteUpData = {
	slug: "template",
	template: true,
	name: "[Experiment name]",
	status: "shipped",
	outcome: "Shipped → Vantacode [build]",
	period: "[start date] – [end date]",
	verdict:
		"[Two or three sentences: what we decided and why. Most readers stop here, so this has to stand on its own without the rest of the page.]",
	sample: "Averages over [n] runs across [k] TTC test cases.",
	spread: "Ranges show [spread measure].",
	whatChanged: [
		"[A plain-language description of the change to gg's architecture, written for developers who use harnesses but haven't read gg's source.]",
		"[Any implementation detail that matters for interpreting the results, such as what stayed fixed and what was tuned.]",
	],
	// Dummy numbers, only here so the tables and charts have something to draw.
	results: [
		{
			id: "experiment",
			name: "gg",
			version: "[build]",
			role: "experiment",
			passRate: { value: 70, spread: 2 },
			costPerRun: { value: 1.5, spread: 0.1 },
			tokensPerRun: { value: 400, spread: 30 },
			cachedShare: 60,
			functionality: {
				broken: 10,
				scuffed: 15,
				passable: 25,
				great: 30,
				flawless: 20,
			},
		},
		{
			id: "baseline",
			name: "gg",
			version: "[previous build]",
			role: "baseline",
			passRate: { value: 65, spread: 2 },
			costPerRun: { value: 2, spread: 0.1 },
			tokensPerRun: { value: 450, spread: 30 },
			cachedShare: 40,
			functionality: {
				broken: 15,
				scuffed: 20,
				passable: 25,
				great: 25,
				flawless: 15,
			},
		},
		{
			id: "harness-a",
			name: "[Harness A]",
			version: "[version]",
			role: "other",
			snapshot: "runs from [Mon YYYY]",
			passRate: { value: 68, spread: 2 },
			costPerRun: { value: 2.4, spread: 0.1 },
			tokensPerRun: { value: 520, spread: 30 },
			cachedShare: 55,
			functionality: {
				broken: 12,
				scuffed: 18,
				passable: 25,
				great: 28,
				flawless: 17,
			},
		},
		{
			id: "harness-b",
			name: "[Harness B]",
			version: "[version]",
			role: "other",
			snapshot: "runs from [Mon YYYY]",
			passRate: { value: 60, spread: 2 },
			costPerRun: { value: 1.8, spread: 0.1 },
			tokensPerRun: { value: 480, spread: 30 },
			cachedShare: 35,
			functionality: {
				broken: 20,
				scuffed: 22,
				passable: 26,
				great: 20,
				flawless: 12,
			},
		},
	],
	discussion: [
		"[Why we adopted it, or why it was meaningful enough to act on: the evidence that justified the decision.]",
		"[Optional: anything else the author wants to raise, such as surprises, caveats or follow-up ideas.]",
	],
	lineage: [
		{
			relation: "Grew from · retired",
			name: "[Earlier experiment]",
			kind: "pending",
			tone: "neutral",
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
	],
	dataLinks: [
		"Download aggregated results (CSV)",
		"The [n] runs on The Test Cabinet ↗",
		"TTC methodology ↗",
		"gg [build] source and config ↗",
	],
};
