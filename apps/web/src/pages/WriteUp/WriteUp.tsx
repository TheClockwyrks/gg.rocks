import { useParams } from "react-router";
import { writeUps } from "@/data/writeUps";
import { NotFound } from "@/pages/ComingSoon/ComingSoon";
import { ComparisonWriteUp } from "./ComparisonWriteUp";
import { DesignChange } from "./DesignChange";
import { StandardWriteUp } from "./StandardWriteUp";

export function WriteUp() {
	const { slug } = useParams();
	const data = writeUps.find((writeUp) => writeUp.slug === slug);

	if (data?.comparison) {
		return (
			<ComparisonWriteUp
				key={data.slug}
				data={data}
				file={data.comparison}
			/>
		);
	}
	if (data) {
		return (
			<StandardWriteUp
				// Start afresh (chart axis, scroll position in the contents) when
				// moving from one write-up straight to another.
				key={data.slug}
				data={data}
			/>
		);
	}
	// The one write-up that predates the standard layout.
	if (slug === "design-change") return <DesignChange />;
	return <NotFound />;
}
