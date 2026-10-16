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
	/** A route on this site, or a full address for a section hosted elsewhere. */
	path: string;
}

export const sections: Record<SectionId, Section> = {
	experiments: {
		id: "experiments",
		label: "Experiments",
		path: "/experiments",
	},
	benchmarks: { id: "benchmarks", label: "Benchmarks", path: "/benchmarks" },
	docs: { id: "docs", label: "Docs", path: "https://docs.gg.rocks" },
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
