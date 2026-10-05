import { Link } from "react-router";
import { PageBody } from "@/components/PageBody/PageBody";
import { PageIntro } from "@/components/PageIntro/PageIntro";
import { sections, type SectionId } from "@/data/site";

/** Stand-in for sections that have not been designed yet. */
export function ComingSoon({ section }: { section: SectionId }) {
	return (
		<PageBody width="narrow">
			<PageIntro
				eyebrow={sections[section].label}
				title="Not here yet"
			>
				This part of the site is still being built. In the meantime, see{" "}
				<Link to={sections.experiments.path}>what we're testing</Link>.
			</PageIntro>
		</PageBody>
	);
}

export function NotFound() {
	return (
		<PageBody width="narrow">
			<PageIntro
				eyebrow="404"
				title="Page not found"
			>
				There is nothing at this address. Head back to the{" "}
				<Link to="/">home page</Link>.
			</PageIntro>
		</PageBody>
	);
}
