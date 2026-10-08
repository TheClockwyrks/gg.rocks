import { useCallback } from "react";
import { PageBody } from "@/components/PageBody/PageBody";
import { PageIntro } from "@/components/PageIntro/PageIntro";
import { PlayableBuild } from "@/components/PlayableBuild/PlayableBuild";
import { builds, type Build } from "@/data/builds";
import { fetchRun } from "@/services/runs";
import { useLoaded } from "@/utils/useLoaded";
import styles from "./Benchmarks.module.scss";

export function Benchmarks() {
	return (
		<PageBody>
			<PageIntro
				eyebrow="Benchmarks"
				title="Finished builds"
			>
				What comes out the other end of a run. Each build below is playable as
				it was delivered, with nothing fixed up afterwards.
			</PageIntro>

			{builds.map((build) => (
				<BuildSection
					key={build.id}
					build={build}
				/>
			))}
		</PageBody>
	);
}

function BuildSection({ build }: { build: Build }) {
	const load = useCallback(() => fetchRun(build.runUrl), [build.runUrl]);
	const [run] = useLoaded(load);

	return (
		<section className={styles.build}>
			<header className={styles.heading}>
				<h2 className={styles.title}>{build.title}</h2>
				<p className={styles.summary}>{build.summary}</p>
			</header>
			{run.status === "ready" ? (
				<PlayableBuild
					title={build.title}
					src={run.data.links.playableBuild}
				/>
			) : (
				<p
					className={styles.status}
					role={run.status === "failed" ? "alert" : "status"}
				>
					{run.status === "failed"
						? "This build could not be loaded."
						: "Loading build…"}
				</p>
			)}
		</section>
	);
}
