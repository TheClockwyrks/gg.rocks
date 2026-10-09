import { BuildShowcase } from "@/components/BuildShowcase/BuildShowcase";
import { PageBody } from "@/components/PageBody/PageBody";
import { PageIntro } from "@/components/PageIntro/PageIntro";
import { PageNotice } from "@/components/PageNotice/PageNotice";
import { benchmark } from "@/data/benchmarks";
import { buildRunUrls } from "@/data/builds";
import { seriesLabel, type BenchmarkFile } from "@/data/runData";
import { ComparedAgainst, Method, Section } from "@/pages/WriteUp/blocks";
import { ResultFigures } from "@/pages/WriteUp/ResultFigures";
import { formatTimestamp, NO_DATA } from "@/utils/format";
import { useLoaded } from "@/utils/useLoaded";
import styles from "./Benchmarks.module.scss";

const SAMPLE_NOTICE =
	"Sample data: every run behind the figures on this page was invented, to show the layout with enough runs to fill each chart.";

const count = (n: number, one: string, many: string) =>
	`${n} ${n === 1 ? one : many}`;

/**
 * How gg's current build stands against the other harnesses, and what it
 * builds. The figures come from one pull of The Test Cabinet (see
 * `data/benchmarks`): when it was taken shows at once, from the summary, and
 * the figures once the pull itself has been fetched.
 */
export function Benchmarks() {
	const { summary } = benchmark;
	const [file] = useLoaded(benchmark.load);
	const pulled = formatTimestamp(summary.pulledAt);

	return (
		<PageBody>
			<div className={styles.opening}>
				{summary.synthetic && <PageNotice>{SAMPLE_NOTICE}</PageNotice>}
				<PageIntro
					eyebrow="Benchmarks"
					title="gg against the field"
				>
					How gg's current build compares with other coding harnesses on the
					same models and test cases, and what it builds when left to finish.
				</PageIntro>
				<p className={styles.snapshot}>
					gg {summary.version ?? NO_DATA} · data pulled {pulled}
				</p>
			</div>

			{file.status === "ready" ? (
				<Results
					file={file.data}
					pulled={pulled}
				/>
			) : (
				<Method>
					{file.status === "failed"
						? "The runs behind this page could not be loaded."
						: "Loading the runs behind this page…"}
				</Method>
			)}

			<Section
				id="builds"
				title="Finished builds"
				lead={
					<Method>
						Each build is playable as it was delivered at the end of its run,
						with nothing fixed up afterwards.
					</Method>
				}
				spacious
			>
				{buildRunUrls.map((runUrl) => (
					<BuildShowcase
						key={runUrl}
						runUrl={runUrl}
					/>
				))}
			</Section>
		</PageBody>
	);
}

function Results({ file, pulled }: { file: BenchmarkFile; pulled: string }) {
	const { summary } = benchmark;
	const [, ...others] = file.series;

	return (
		<>
			<ComparedAgainst
				baselines={others.map(
					(series) => `${seriesLabel(series)} · ${series.runs} runs`,
				)}
				note={`A snapshot of The Test Cabinet's runs as they stood on ${pulled}. Models and harness versions released since then are not in it, and the harnesses here may have improved.`}
			/>

			<Section
				id="results"
				title="Results"
				lead={
					<Method>
						gg ran {count(summary.models, "model", "models")} on{" "}
						{count(summary.cases, "test case", "test cases")}:{" "}
						{count(
							summary.pairs,
							"model and case pair",
							"model and case pairs",
						)}
						, {count(summary.runs, "run", "runs")}. Every other harness is
						measured only on the pairs it shares with gg, averaged per pair and
						then across pairs. Intervals are 95% bootstrap ranges over the
						shared pairs; none is drawn below three pairs.
					</Method>
				}
				spacious
			>
				<ResultFigures
					file={file}
					against="field"
				/>
			</Section>
		</>
	);
}
