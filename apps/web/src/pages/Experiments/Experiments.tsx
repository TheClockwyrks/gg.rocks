import { useState } from "react";
import { PageBody } from "@/components/PageBody/PageBody";
import { PageIntro } from "@/components/PageIntro/PageIntro";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { experiments, type ExperimentStatus } from "@/data/experiments";
import { ExperimentHeadings, ExperimentRow } from "./ExperimentRow";
import styles from "./Experiments.module.scss";

type Filter = "all" | ExperimentStatus;

const filters: { id: Filter; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "active", label: "Active" },
	{ id: "shipped", label: "Shipped" },
	{ id: "retired", label: "Removed" },
];

export function Experiments() {
	const [filter, setFilter] = useState<Filter>("all");
	const visible = experiments.filter(
		// The template is not a real experiment, so it only shows under "All".
		(experiment) =>
			filter === "all" ||
			(experiment.status === filter && !experiment.template),
	);

	return (
		<PageBody rail="experiments">
			<PageIntro
				eyebrow="Experiments"
				title="What we're testing"
			>
				Every change to gg starts here. Each one is measured on TTC runs against
				the current build, then either ships to Vantacode or is retired with a
				write-up.
			</PageIntro>

			<SegmentedControl
				label="Filter experiments by status"
				options={filters}
				value={filter}
				onChange={setFilter}
			/>

			<div>
				<ExperimentHeadings />
				{visible.length > 0 ? (
					<ul className={styles.list}>
						{visible.map((experiment) => (
							<ExperimentRow
								key={experiment.id}
								experiment={experiment}
							/>
						))}
					</ul>
				) : (
					<p className={styles.empty}>No experiments with this status yet.</p>
				)}
			</div>
		</PageBody>
	);
}
