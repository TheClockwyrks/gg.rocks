import type { HarnessResult } from "./writeUps/types";

// The shapes of the files the scripts in scripts/run-data/ write to run-data/:
// benchmark.json, gg's current build against the other harnesses, and
// experiment.json, a gg build against the last one that shipped. Both are a
// comparison of gg with other series. A null figure means "no data", never
// zero.

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

export interface PulledRun {
	series: string;
	model: string;
	category: Category;
	/** A fraction, 0-1. */
	passRate: number | null;
}

interface Meta {
	backend: string;
	/**
	 * When the runs were read, as an ISO timestamp in UTC. The figures are a
	 * snapshot of that moment: models and harnesses released since are not in
	 * them.
	 */
	pulledAt: string;
	runStates: string[];
	testTypes: string[];
	/** The gg version the figures are for. */
	currentVersion: string | null;
	/** Every run was invented, to show the page with a full set of data. */
	synthetic: boolean;
	warnings: string[];
}

/** gg's build, the first series, against each of the others. */
export interface ComparisonFile {
	meta: Meta;
	series: Series[];
	/** The models gg's build ran. */
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
	runs: PulledRun[];
}

/** benchmark.json: gg against every other harness. */
export type BenchmarkFile = ComparisonFile;

/** experiment.json: the gg build under test against the last that shipped. */
export interface ExperimentFile extends ComparisonFile {
	meta: Meta & { baselineVersion: string };
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

/** A figure as a write-up measure, in the units the charts use. */
export const measure = (value: number | null, per = 1) =>
	value === null ? null : { value: value / per };

/** Percentage of a run's tokens that were read from cache. */
export const cachedShare = (
	cached: number | null,
	total: number | null,
): number | null =>
	cached !== null && total ? Math.round((cached / total) * 100) : null;

function result(series: Series, figures: Figures, side: Side): HarnessResult {
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
		cachedShare: cachedShare(
			figures.cachedInputTokens,
			figures.totalTokens,
		),
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
	file: ComparisonFile,
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
