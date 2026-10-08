import { Diamond } from "@/components/Strand/Diamond";
import type { ExperimentStatus } from "@/data/experiments";
import styles from "./Sparkline.module.scss";

/** A fragment of strand that shows, at a glance, how an experiment ended. */
export function Sparkline({ status }: { status: ExperimentStatus }) {
	return (
		<svg
			width="96"
			height="48"
			viewBox="0 0 96 48"
			className={styles.sparkline}
			aria-hidden="true"
		>
			{status === "active" && (
				<>
					<path
						d="M0 24 C 24 24 36 14 60 18 C 70 20 74 24 80 24"
						className={styles.exploring}
					/>
					<path
						d="M44 16 C 48 8 54 6 60 4"
						className={styles.offshoot}
					/>
					<Diamond
						cx={80}
						cy={24}
						size={8}
						className={styles.head}
					/>
				</>
			)}
			{status === "shipped" && (
				<path
					d="M0 24 C 30 24 50 12 96 20"
					className={styles.shipped}
				/>
			)}
			{status === "retired" && (
				<path
					d="M0 24 C 20 24 34 34 52 32"
					className={styles.retired}
				/>
			)}
		</svg>
	);
}
