import { Link } from "react-router";
import { PageBody } from "@/components/PageBody/PageBody";
import { PageIntro } from "@/components/PageIntro/PageIntro";
import { releases } from "@/data/changelog";
import { writeUpPath } from "@/data/experiments";
import styles from "./Changelog.module.scss";

export function Changelog() {
	return (
		<PageBody width="narrow">
			<PageIntro
				eyebrow="Changelog"
				title="What shipped"
			>
				Every gg release, and the experiment behind each change. Changes that
				came from experiments also went into Vantacode.
			</PageIntro>

			<div>
				{releases.map((release) => (
					<article
						key={release.id}
						className={styles.release}
					>
						<header className={styles.meta}>
							<h2 className={styles.build}>{release.build}</h2>
							<span className={styles.date}>{release.date}</span>
							{release.vantacode && (
								<span className={styles.shippedTo}>→ {release.vantacode}</span>
							)}
						</header>
						<ul className={styles.changes}>
							{release.changes.map((change, index) => (
								<li
									key={index}
									className={styles.change}
								>
									<span className={styles.summary}>{change.summary}</span>
									{change.writeUp ? (
										<Link
											to={writeUpPath(change.writeUp)}
											className={styles.source}
										>
											{change.source}
										</Link>
									) : (
										<span className={styles.source}>{change.source}</span>
									)}
								</li>
							))}
						</ul>
					</article>
				))}
			</div>
		</PageBody>
	);
}
