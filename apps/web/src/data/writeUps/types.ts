import type { ExperimentFile } from "./experimentData";

/** Functionality ratings given to each test run, worst to best. */
export const ratings = [
	{ id: "broken", label: "Broken" },
	{ id: "scuffed", label: "Scuffed" },
	{ id: "passable", label: "Passable" },
	{ id: "great", label: "Great" },
	{ id: "flawless", label: "Flawless" },
] as const;

export type Rating = (typeof ratings)[number]["id"];

/** How a run without a functionality rating ended. */
export const unratedOutcomes = [
	{ id: "unrated", label: "Not yet rated" },
	{ id: "didNotFinish", label: "Did not finish" },
] as const;

export type Outcome = Rating | (typeof unratedOutcomes)[number]["id"];

/** Every way a run is counted, in stacking order from the bottom up. */
export const outcomes: readonly { id: Outcome; label: string }[] = [
	...unratedOutcomes,
	...ratings,
];

/** An average over the runs, with its spread where one was measured. */
export interface Measure {
	value: number;
	spread?: number;
}

/** One harness's results from The Test Cabinet for an experiment. */
export interface HarnessResult {
	id: string;
	name: string;
	/** Null when the runs span several versions. */
	version: string | null;
	/**
	 * "experiment" is the gg build under test and "baseline" the gg build it
	 * is measured against. Every write-up has one experiment; the baseline is
	 * missing until the previous build has runs of its own.
	 */
	role: "experiment" | "baseline" | "other";
	/** How many runs the figures cover, and how many of those have a score. */
	runs?: { total: number; scored: number };
	/** Percentage of test runs that passed. Null figures have no data. */
	passRate: Measure | null;
	/** US dollars. */
	costPerRun: Measure | null;
	/** Thousands of tokens. */
	tokensPerRun: Measure | null;
	/** Percentage of tokens served from cache. */
	cachedShare: number | null;
	/** How many test runs received each functionality rating. */
	functionality: Record<Rating, number> &
		Partial<Record<Exclude<Outcome, Rating>, number>>;
}

export interface LineageStep {
	/** How this experiment relates to the one being read. */
	relation: string;
	name: string;
	/** "self" is the experiment being read; "pending" has no page yet. */
	kind: "self" | "link" | "pending";
	tone: "neutral" | "accent" | "dashed";
	to?: string;
	/** Whether the strand leading to the next step is lit. */
	lit?: boolean;
}

/**
 * Everything an experiment write-up needs. The numbers come from The
 * Test Cabinet; the prose is written once the experiment has concluded.
 */
export interface WriteUpData {
	slug: string;
	name: string;
	status: "shipped" | "retired";
	/** Outcome as shown in the status pill. */
	outcome: string;
	/** When the experiment ran, e.g. "14 Sep – 28 Sep 2026". */
	period: string;
	/** The decision and why, in two or three sentences. */
	verdict: string;
	/** How many runs and test cases the averages cover. */
	sample: string;
	/** What the ± ranges mean. */
	spread: string;
	whatChanged: string[];
	results: HarnessResult[];
	/**
	 * Must justify the decision: why the change was adopted, or was meaningful
	 * enough to act on. Anything beyond that is up to the author.
	 */
	discussion: string[];
	lineage: LineageStep[];
	dataLinks: string[];
	/** Every run behind the page was invented, to show the layout. */
	synthetic: boolean;
	/**
	 * Fetches the full pull the charts are drawn from. It is kept out of the
	 * site's own bundle, so that a new experiment costs nothing until opened.
	 */
	load: () => Promise<ExperimentFile>;
}

export const writeUpPath = (slug: string): string => `/experiments/${slug}`;

/** Full display name of a harness build, e.g. "Claude Code 2.1.40". */
export const harnessLabel = (result: HarnessResult): string =>
	result.version ? `${result.name} ${result.version}` : result.name;

const byRole = (
	data: WriteUpData,
	role: HarnessResult["role"],
): HarnessResult | undefined =>
	data.results.find((entry) => entry.role === role);

export function experimentResult(data: WriteUpData): HarnessResult {
	const result = byRole(data, "experiment");
	if (!result)
		throw new Error(`Write-up "${data.slug}" has no experiment result`);
	return result;
}

export const baselineResult = (data: WriteUpData): HarnessResult | undefined =>
	byRole(data, "baseline");
