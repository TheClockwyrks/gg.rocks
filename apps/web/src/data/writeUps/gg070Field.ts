import file from "@run-data/0.7.0/2026-10-07/experiment.json";
import { comparisonWriteUp, type ExperimentFile } from "./experimentData";

const name = "gg 0.7.0 against the field";

/**
 * A preview entry: the numbers are the real ones from a pull of The Test
 * Cabinet's staging backend, and the prose is placeholder until there is an
 * experiment to write up.
 */
export const gg070Field = comparisonWriteUp(file as unknown as ExperimentFile, {
	slug: "gg-0-7-0-field",
	name,
	status: "shipped",
	outcome: "Shipped → gg 0.7.0",
	verdict:
		"[Preview. The numbers on this page are real, from The Test Cabinet's staging backend; the prose is placeholder. gg has two runs so far and shares one model and test case with one other harness, so nothing here supports a conclusion yet.]",
	whatChanged: ["[What changed in this build.]"],
	discussion: ["[Why the change was adopted.]"],
	lineage: [
		{
			relation: "This experiment · shipped",
			name,
			kind: "self",
			tone: "accent",
		},
	],
	dataLinks: ["The runs on The Test Cabinet ↗", "TTC methodology ↗"],
});
