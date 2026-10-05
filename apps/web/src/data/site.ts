export type SectionId =
	"experiments" | "benchmarks" | "docs" | "changelog" | "download";

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
	changelog: { id: "changelog", label: "Changelog", path: "/changelog" },
	download: { id: "download", label: "Download", path: "/download" },
};

/** Order of the text links in the top bar; Download is rendered as a button. */
export const headerNav: SectionId[] = [
	"experiments",
	"benchmarks",
	"docs",
	"changelog",
];

/** Order of the sections along the left-margin strand. */
export const railNav: SectionId[] = [
	"benchmarks",
	"experiments",
	"changelog",
	"download",
	"docs",
];
