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

const active = (id: string): Experiment => ({
	id,
	name: "[Experiment name]",
	timeline: "started [date] · gg [build]",
	status: "active",
	outcome: "Active · testing",
	deltas: placeholderDeltas,
});

const shipped = (id: string): Experiment => ({
	id,
	name: "[Experiment name]",
	timeline: "[start] – [end] · gg [build]",
	status: "shipped",
	outcome: "Shipped → Vantacode",
	deltas: placeholderDeltas,
	writeUp: "harness-comparison",
});

// Placeholder content until real experiment data is wired in.
export const experiments: Experiment[] = [
	active("active-1"),
	active("active-2"),
	shipped("shipped-1"),
	shipped("shipped-2"),
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

export const writeUpPath = (slug: string): string => `/experiments/${slug}`;
