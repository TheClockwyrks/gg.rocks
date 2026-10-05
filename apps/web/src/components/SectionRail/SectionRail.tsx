import type { CSSProperties } from "react";
import { Link } from "react-router";
import { Strand } from "@/components/Strand/Strand";
import { railNav, sections, type SectionId } from "@/data/site";
import { tokens } from "@/utils/tokens";
import styles from "./SectionRail.module.scss";

const FIRST_NODE = 60;
const NODE_SPACING = 68;
const STRAND_HEIGHT = 1600;

const nodes = railNav.map((_, index) => FIRST_NODE + index * NODE_SPACING);

/** The left-margin strand: a mini-map of the site's sections. */
export function SectionRail({ current }: { current: SectionId }) {
	return (
		<nav
			aria-label="Sections"
			className={styles.rail}
		>
			<div className={styles.track}>
				<Strand
					width={tokens.railWidth}
					height={STRAND_HEIGHT}
					nodes={nodes}
					current={railNav.indexOf(current)}
					tone="accent"
				/>
				{railNav.map((id, index) => (
					<Link
						key={id}
						to={sections[id].path}
						title={sections[id].label}
						aria-label={sections[id].label}
						aria-current={id === current ? "page" : undefined}
						className={styles.stop}
						style={{ "--y": `${nodes[index]}px` } as CSSProperties}
					/>
				))}
			</div>
		</nav>
	);
}
