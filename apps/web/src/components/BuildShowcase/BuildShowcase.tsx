import { useCallback } from "react";
import { PlayableBuild } from "@/components/PlayableBuild/PlayableBuild";
import { fetchRun, runPageUrl, type Run } from "@/services/runs";
import { formatDollars, formatThousands } from "@/utils/format";
import { useLoaded } from "@/utils/useLoaded";
import styles from "./BuildShowcase.module.scss";

interface BuildShowcaseProps {
	/** Address of the run's record on The Test Cabinet. */
	runUrl: string;
}

/** A test case's name from its slug, e.g. "tower-defence" → "Tower Defence". */
const titleFromSlug = (slug: string): string =>
	slug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

const sum = (a: number | null, b: number | null): number | null =>
	a == null && b == null ? null : (a ?? 0) + (b ?? 0);

const tokens = (count: number | null): string =>
	formatThousands(count == null ? null : count / 1000);

function facts({ subject, metrics }: Run): [label: string, value: string][] {
	const { cachedInput, uncachedInput, output } = metrics.tokens;
	return [
		["Harness", `${subject.harnessSlug} ${subject.harnessVersion}`],
		["Model", subject.modelId],
		["Input tokens", tokens(sum(cachedInput, uncachedInput))],
		["Output tokens", tokens(output)],
		["Cost", formatDollars(metrics.cost.actual)],
	];
}

/**
 * A finished build from a Test Cabinet run: playable, with the run's harness,
 * model, token use and cost. Everything shown is loaded from the run record.
 */
export function BuildShowcase({ runUrl }: BuildShowcaseProps) {
	const load = useCallback(() => fetchRun(runUrl), [runUrl]);
	const [run] = useLoaded(load);

	if (run.status !== "ready") {
		return (
			<p
				className={styles.status}
				role={run.status === "failed" ? "alert" : "status"}
			>
				{run.status === "failed"
					? "This build could not be loaded."
					: "Loading build…"}
			</p>
		);
	}

	const title = titleFromSlug(run.data.subject.testCaseSlug);

	return (
		<section className={styles.build}>
			<h2 className={styles.title}>{title}</h2>
			<PlayableBuild
				title={title}
				src={run.data.links.playableBuild}
			/>
			<div className={styles.details}>
				<dl className={styles.facts}>
					{facts(run.data).map(([label, value]) => (
						<div
							key={label}
							className={styles.fact}
						>
							<dt className={styles.label}>{label}</dt>
							<dd className={styles.value}>{value}</dd>
						</div>
					))}
				</dl>
				<a
					className={styles.source}
					href={runPageUrl(runUrl)}
					target="_blank"
					rel="noreferrer"
				>
					Full run on The Test Cabinet ↗
				</a>
			</div>
		</section>
	);
}
