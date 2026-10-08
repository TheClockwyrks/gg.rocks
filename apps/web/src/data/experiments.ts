import { formatChange, formatPoints } from "@/utils/format";
import { writeUps } from "./writeUps";
import {
	baselineResult,
	experimentResult,
	type WriteUpData,
} from "./writeUps/types";

export { writeUpPath } from "./writeUps/types";

export type ExperimentStatus = "active" | "shipped" | "retired";

export interface ExperimentDeltas {
	tokens: string;
	cost: string;
	passRate: string;
	cacheHit: string;
}

export interface Experiment {
	id: string;
	name: string;
	/** When it ran and on which build. */
	timeline: string;
	status: ExperimentStatus;
	/** Outcome as shown in the status pill. */
	outcome: string;
	deltas: ExperimentDeltas;
	/** Slug of the write-up, once the experiment has concluded. */
	writeUp?: string;
}

export const metricLabels: Record<keyof ExperimentDeltas, string> = {
	tokens: "Tokens",
	cost: "Cost",
	passRate: "Pass rate",
	cacheHit: "Cache hit",
};

const placeholderDeltas: ExperimentDeltas = {
	tokens: "[±x%]",
	cost: "[±x%]",
	passRate: "[±x%]",
	cacheHit: "[±x%]",
};

/**
 * Change from the baseline gg build to the build under test; every delta is
 * blank while there is no baseline to measure against.
 */
export function writeUpDeltas(data: WriteUpData): ExperimentDeltas {
	const from = baselineResult(data);
	const to = experimentResult(data);
	return {
		tokens: formatChange(from?.tokensPerRun?.value, to.tokensPerRun?.value),
		cost: formatChange(from?.costPerRun?.value, to.costPerRun?.value),
		passRate: formatPoints(from?.passRate?.value, to.passRate?.value),
		cacheHit: formatPoints(from?.cachedShare, to.cachedShare, 0),
	};
}

/** The index row for an experiment that has a write-up. */
function fromWriteUp(data: WriteUpData): Experiment {
	return {
		id: data.slug,
		name: data.name,
		timeline: `${data.period} · gg ${experimentResult(data).version}`,
		status: data.status,
		outcome: data.outcome.replace(/(Vantacode).*/, "$1"),
		deltas: writeUpDeltas(data),
		writeUp: data.slug,
	};
}

const active = (id: string): Experiment => ({
	id,
	name: "[Experiment name]",
	timeline: "started [date] · gg [build]",
	status: "active",
	outcome: "Active · testing",
	deltas: placeholderDeltas,
});

// Apart from the standard write-ups, these are placeholders until real
// experiment data is wired in.
export const experiments: Experiment[] = [
	active("active-1"),
	active("active-2"),
	...writeUps.map(fromWriteUp),
	{
		id: "retired-1",
		name: "[Experiment name]",
		timeline: "[start] – [end] · gg [build]",
		status: "retired",
		outcome: "Retired",
		deltas: placeholderDeltas,
		writeUp: "design-change",
	},
];
