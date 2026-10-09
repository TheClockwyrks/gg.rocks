/**
 * The parts of a Test Cabinet run record the site reads. The record also
 * carries the run's duration and validation results.
 */
export interface Run {
	id: string;
	/** When the run ended, as an ISO timestamp. */
	finishedAt: string;
	links: {
		playableBuild: string;
		sourceRepo?: string;
	};
	subject: {
		harnessSlug: string;
		harnessVersion: string;
		modelId: string;
		testCaseSlug: string;
	};
	metrics: {
		/** In dollars. */
		cost: { actual: number | null };
		tokens: {
			cachedInput: number | null;
			uncachedInput: number | null;
			output: number | null;
		};
	};
}

export async function fetchRun(runUrl: string): Promise<Run> {
	const response = await fetch(runUrl);
	if (!response.ok) {
		throw new Error(`Run request failed with status ${response.status}`);
	}
	const run = (await response.json()) as Partial<Run>;
	if (
		!run.links?.playableBuild ||
		!run.subject ||
		!run.metrics ||
		!run.finishedAt
	) {
		throw new Error(
			"Run record is missing its build, subject, metrics or date",
		);
	}
	return run as Run;
}

/** The run's page on The Test Cabinet, which sits beside its record. */
export const runPageUrl = (runUrl: string): string =>
	runUrl.replace(/\.json$/, "");
