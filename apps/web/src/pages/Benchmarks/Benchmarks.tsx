import { BuildShowcase } from "@/components/BuildShowcase/BuildShowcase";
import { PageBody } from "@/components/PageBody/PageBody";
import { PageIntro } from "@/components/PageIntro/PageIntro";
import { buildRunUrls } from "@/data/builds";

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

			{buildRunUrls.map((runUrl) => (
				<BuildShowcase
					key={runUrl}
					runUrl={runUrl}
				/>
			))}
		</PageBody>
	);
}
