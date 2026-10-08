/**
 * The parts of a Test Cabinet run record the site reads. The record also
 * carries the run's cost, timings and validation results.
 */
export interface Run {
	id: string;
	links: {
		playableBuild: string;
		sourceRepo?: string;
	};
}

export async function fetchRun(runUrl: string): Promise<Run> {
	const response = await fetch(runUrl);
	if (!response.ok) {
		throw new Error(`Run request failed with status ${response.status}`);
	}
	const run = (await response.json()) as Partial<Run>;
	if (!run.id || !run.links?.playableBuild) {
		throw new Error("Run has no playable build");
	}
	return run as Run;
}
