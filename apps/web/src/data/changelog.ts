export interface ChangelogChange {
	summary: string;
	/** Where the change came from; `writeUp` links to the experiment. */
	source: string;
	writeUp?: string;
}

export interface Release {
	id: string;
	build: string;
	date: string;
	/** The Vantacode build these changes also went into, if any. */
	vantacode?: string;
	changes: ChangelogChange[];
}

const fromExperiment: ChangelogChange = {
	summary: "[Change summary]",
	source: "From experiment: [Experiment name] · [Δ pass rate], [Δ cost] →",
	writeUp: "sample-comparison",
};

const maintenance: ChangelogChange = {
	summary: "[Change summary]",
	source: "Maintenance · no experiment",
};

// Placeholder content until real release data is wired in.
export const releases: Release[] = [
	{
		id: "release-3",
		build: "gg [build]",
		date: "[date]",
		vantacode: "Vantacode [build]",
		changes: [fromExperiment, maintenance],
	},
	{
		id: "release-2",
		build: "gg [build]",
		date: "[date]",
		vantacode: "Vantacode [build]",
		changes: [fromExperiment],
	},
	{
		id: "release-1",
		build: "gg [build]",
		date: "[date]",
		changes: [
			{
				summary: "Removed [feature]",
				source: "Retired experiment: [Experiment name] · why it came out →",
				writeUp: "design-change",
			},
			maintenance,
		],
	},
];
