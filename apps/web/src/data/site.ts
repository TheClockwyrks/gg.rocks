export type SectionId =
	| "experiments"
	| "benchmarks"
	| "docs"
	| "pricing"
	| "changelog"
	| "download";

export interface Section {
	id: SectionId;
	label: string;
	path: string;
}

export const sections: Record<SectionId, Section> = {
	experiments: {
		id: "experiments",
		label: "Experiments",
		path: "/experiments",
	},
	benchmarks: { id: "benchmarks", label: "Benchmarks", path: "/benchmarks" },
	docs: { id: "docs", label: "Docs", path: "/docs" },
	pricing: { id: "pricing", label: "Pricing", path: "/pricing" },
	changelog: { id: "changelog", label: "Changelog", path: "/changelog" },
	download: { id: "download", label: "Download", path: "/download" },
};

/** Pages for the visitor's own account, which sit outside the sections. */
export const accountPaths = {
	login: "/login",
	signup: "/signup",
	account: "/account",
	subscription: "/account/subscription",
	billing: "/account/billing",
} as const;

/**
 * Order of the text links in the top bar; Download and the account link are
 * rendered as buttons.
 */
export const headerNav: SectionId[] = [
	"experiments",
	"benchmarks",
	"docs",
	"pricing",
	"changelog",
];

/** Order of the sections along the left-margin strand. */
export const railNav: SectionId[] = [
	"benchmarks",
	"experiments",
	"changelog",
	"download",
	"pricing",
	"docs",
];
