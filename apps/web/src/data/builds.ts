export interface Build {
	id: string;
	title: string;
	summary: string;
	/** Test Cabinet's record of the run, which links to the playable build. */
	runUrl: string;
}

// A stand-in run from another harness, until gg has builds of its own.
export const builds: Build[] = [
	{
		id: "deepcore",
		title: "Deepcore",
		summary:
			"A mining game built in one shot from the Deepcore full-stack test case.",
		runUrl: "https://testcabinet.ai/runs/f29c3efb-1157-4f67-b754-8d058a8036e3.json",
	},
];
