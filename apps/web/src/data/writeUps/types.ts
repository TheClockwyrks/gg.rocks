/** Functionality ratings given to each test run, worst to best. */
export const ratings = [
	{ id: "broken", label: "Broken" },
	{ id: "scuffed", label: "Scuffed" },
	{ id: "passable", label: "Passable" },
	{ id: "great", label: "Great" },
	{ id: "flawless", label: "Flawless" },
] as const;

export type Rating = (typeof ratings)[number]["id"];

/** An average over the runs, with its spread. */
export interface Measure {
	value: number;
	spread: number;
}

/** One harness's results from The Test Cabinet for an experiment. */
export interface HarnessResult {
	id: string;
	name: string;
	version: string;
	/**
	 * "experiment" is the gg build under test and "baseline" the gg build it
	 * is measured against; every write-up has exactly one of each.
	 */
	role: "experiment" | "baseline" | "other";
	/** When another harness's runs were taken, e.g. "runs from Sep 2026". */
	snapshot?: string;
	/** Percentage of test runs that passed. */
	passRate: Measure;
	/** US dollars. */
	costPerRun: Measure;
	/** Thousands of tokens. */
	tokensPerRun: Measure;
	/** Percentage of tokens served from cache. */
	cachedShare: number;
	/** How many test runs received each functionality rating. */
	functionality: Record<Rating, number>;
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
 * Everything a standard experiment write-up needs. The numbers come from The
 * Test Cabinet; the prose is written once the experiment has concluded.
 */
export interface WriteUpData {
	slug: string;
	/** Marks the blank-slate entry that shows how a write-up is filled in. */
	template?: boolean;
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
	discussion: string[];
	lineage: LineageStep[];
	dataLinks: string[];
}

export const writeUpPath = (slug: string): string => `/experiments/${slug}`;

/** Full display name of a harness build, e.g. "Claude Code 2.1.40". */
export const harnessLabel = (result: HarnessResult): string =>
	`${result.name} ${result.version}`;

function byRole(data: WriteUpData, role: HarnessResult["role"]): HarnessResult {
	const result = data.results.find((entry) => entry.role === role);
	if (!result)
		throw new Error(`Write-up "${data.slug}" has no ${role} result`);
	return result;
}

export const experimentResult = (data: WriteUpData): HarnessResult =>
	byRole(data, "experiment");

export const baselineResult = (data: WriteUpData): HarnessResult =>
	byRole(data, "baseline");
