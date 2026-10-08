import type { HarnessResult, LineageStep, WriteUpData } from "./types";

// The shape of the experiment.json that
// scripts/experiments/gg-experiment-data.py writes to run-data/. A null figure means "no data", never zero.

export type MetricId =
	| "passRate"
	| "goodShare"
	| "completionRate"
	| "costUsd"
	| "totalTokens"
	| "uncachedInputTokens"
	| "cachedInputTokens"
	| "outputTokens"
	| "durationSeconds";

export type EndingId = "completed" | "gaveUp" | "ranOut" | "harnessError";

type Category = keyof HarnessResult["functionality"];

/** How one side's runs were rated and ended, as shares of its runs. */
interface Side {
	runs: number;
	ratings: Record<Category, number | null>;
	endings: Record<EndingId, number | null>;
}

/** gg against another series on the pairs where both report the metric. */
export interface PairedMetric {
	pairs: number;
	subject: number | null;
	other: number | null;
	/** gg minus the other side. */
	delta: number | null;
	/** A 95% interval for the delta; missing where there are too few pairs. */
	low?: number | null;
	high?: number | null;
}

export interface ComparisonScope {
	pairs: number;
	subject: Side;
	other: Side;
	metrics: Record<MetricId, PairedMetric>;
	/** Each case carries only the metrics the case by case grid can show. */
	cases: {
		case: string;
		pairs: number;
		metrics: Partial<Record<MetricId, PairedMetric>>;
	}[];
}

export interface SubjectScope extends Side {
	pairs: number;
	metrics: Record<MetricId, number | null>;
	cases: {
		case: string;
		pairs: number;
		metrics: Partial<Record<MetricId, number | null>>;
	}[];
}

export interface Series {
	id: string;
	label: string;
	role: HarnessResult["role"];
	/** Null when the runs span several versions (see `versions`). */
	version: string | null;
	versions: string[];
	runs: number;
}

export interface ExperimentRun {
	series: string;
	model: string;
	category: Category;
	/** A fraction, 0-1. */
	passRate: number | null;
}

export interface ExperimentFile {
	meta: {
		backend: string;
		pulledAt: string;
		runStates: string[];
		testTypes: string[];
		currentVersion: string | null;
		previousVersion: string | null;
		/** Every run was invented, to show the page with a full set of data. */
		synthetic: boolean;
		warnings: string[];
	};
	series: Series[];
	/** The models gg's current build ran. */
	models: { id: string; name: string }[];
	cases: { id: string; label: string }[];
	/** Keyed by scope: "all", or a model's id. */
	subject: { scopes: Record<string, SubjectScope> };
	comparisons: {
		against: string;
		/** Why there is nothing to compare, when there is not. */
		reason: string | null;
		scopes: Record<string, ComparisonScope>;
	}[];
	runs: ExperimentRun[];
	trend: {
		basis: "shared" | "own";
		versions: {
			version: string;
			firstRun: string | null;
			runs: number;
			pairs: number;
			metrics: Record<MetricId, number | null>;
		}[];
	};
}

export const ALL_MODELS = "all";

/** A series with its version, or the range its runs span. */
export function seriesLabel(series: Series): string {
	const { versions } = series;
	if (series.version) return `${series.label} ${series.version}`;
	if (versions.length > 1)
		return `${series.label} ${versions[0]}–${versions[versions.length - 1]}`;
	return series.label;
}

type Figures = Record<MetricId, number | null>;

function result(series: Series, figures: Figures, side: Side): HarnessResult {
	const measure = (value: number | null, per = 1) =>
		value === null ? null : { value: value / per };
	const count = (id: Category) =>
		Math.round((side.ratings[id] ?? 0) * side.runs);
	return {
		id: series.id,
		name: series.label,
		version:
			series.version ??
			(series.versions.length > 1
				? `${series.versions[0]}–${series.versions[series.versions.length - 1]}`
				: null),
		role: series.role,
		runs: { total: side.runs, scored: side.runs },
		passRate: measure(figures.passRate, 0.01),
		costPerRun: measure(figures.costUsd),
		tokensPerRun: measure(figures.totalTokens, 1000),
		cachedShare:
			figures.cachedInputTokens !== null && figures.totalTokens
				? Math.round(
						(figures.cachedInputTokens / figures.totalTokens) * 100,
					)
				: null,
		functionality: {
			unrated: count("unrated"),
			didNotFinish: count("didNotFinish"),
			broken: count("broken"),
			scuffed: count("scuffed"),
			passable: count("passable"),
			great: count("great"),
			flawless: count("flawless"),
		},
	};
}

const pick = (
	metrics: ComparisonScope["metrics"],
	side: "subject" | "other",
): Figures =>
	Object.fromEntries(
		Object.entries(metrics).map(([id, metric]) => [id, metric[side]]),
	) as Figures;

/**
 * One result per series in a scope: gg on every pair it ran, and each other
 * series on the pairs it shares with gg. A series that shares none is left out.
 */
export function scopeResults(
	file: ExperimentFile,
	scope: string,
): HarnessResult[] {
	const [subject, ...others] = file.series;
	const own = file.subject.scopes[scope];
	if (!subject || !own) return [];
	const results = [result(subject, own.metrics, own)];
	for (const series of others) {
		const compared = file.comparisons.find(
			(comparison) => comparison.against === series.id,
		)?.scopes[scope];
		if (compared && compared.pairs > 0)
			results.push(
				result(series, pick(compared.metrics, "other"), compared.other),
			);
	}
	return results;
}

/**
 * The shape of summary.json: the few figures the experiments index and the
 * verdict quote, which ship with every page. gg and its previous build are
 * measured on the pairs both ran, so the change between them is like for like.
 */
export interface SummaryFile {
	pulledAt: string;
	/** Every run was invented, to show the page with a full set of data. */
	synthetic: boolean;
	models: number;
	cases: number;
	pairs: number;
	runs: number;
	experiment: SummaryFigures;
	/** Null until the previous build has runs on a pair this one ran. */
	baseline: SummaryFigures | null;
}

interface SummaryFigures {
	version: string | null;
	passRate: number | null;
	costUsd: number | null;
	totalTokens: number | null;
	cachedInputTokens: number | null;
}

function summaryResult(
	figures: SummaryFigures,
	role: HarnessResult["role"],
): HarnessResult {
	const measure = (value: number | null, per = 1) =>
		value === null ? null : { value: value / per };
	return {
		id: role,
		name: "gg",
		version: figures.version,
		role,
		passRate: measure(figures.passRate, 0.01),
		costPerRun: measure(figures.costUsd),
		tokensPerRun: measure(figures.totalTokens, 1000),
		cachedShare:
			figures.cachedInputTokens !== null && figures.totalTokens
				? Math.round(
						(figures.cachedInputTokens / figures.totalTokens) * 100,
					)
				: null,
		functionality: {
			broken: 0,
			scuffed: 0,
			passable: 0,
			great: 0,
			flawless: 0,
		},
	};
}

/** The parts of a write-up that are written rather than measured. */
interface Written {
	slug: string;
	name: string;
	status: WriteUpData["status"];
	outcome: string;
	verdict: string;
	whatChanged: string[];
	discussion: string[];
	lineage: LineageStep[];
	dataLinks: string[];
}

const count = (n: number, one: string, many: string) =>
	`${n} ${n === 1 ? one : many}`;

/**
 * A write-up whose every number comes from one pull: its summary, which is
 * part of the site, and its experiment.json, which `load` fetches when the
 * page is opened.
 */
export function comparisonWriteUp(
	summary: SummaryFile,
	load: () => Promise<{ default: unknown }>,
	written: Written,
): WriteUpData {
	const pulledOn = new Date(summary.pulledAt).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	});
	return {
		...written,
		synthetic: summary.synthetic,
		period: `runs pulled ${pulledOn}`,
		sample: `gg ran ${count(summary.models, "model", "models")} on ${count(summary.cases, "test case", "test cases")}: ${count(summary.pairs, "model and case pair", "model and case pairs")}, ${count(summary.runs, "run", "runs")}. Every other harness is measured only on the pairs it shares with gg, averaged per pair and then across pairs.`,
		spread: "Intervals are 95% bootstrap ranges over the shared pairs; none is drawn below three pairs.",
		results: [
			summaryResult(summary.experiment, "experiment"),
			...(summary.baseline
				? [summaryResult(summary.baseline, "baseline")]
				: []),
		],
		load: () => load().then((module) => module.default as ExperimentFile),
	};
}
