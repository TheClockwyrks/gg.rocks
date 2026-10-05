import { FigureScroll } from "@/components/Figure/Figure";
import { Diamond } from "@/components/Strand/Diamond";
import { cx } from "@/utils/cx";
import styles from "./charts.module.scss";

// The charts are placeholder shapes drawn on a fixed canvas until real data
// (and a charting layer) replaces them.
const WIDTH = 1040;
const PLOT_LEFT = 80;
const PLOT_RIGHT = 1000;
const GRID_LINES = [40, 110, 180, 250];

function Grid({ baseline }: { baseline: number }) {
	return (
		<>
			{GRID_LINES.map((y) => (
				<line
					key={y}
					x1={PLOT_LEFT}
					y1={y}
					x2={PLOT_RIGHT}
					y2={y}
					className={styles.gridLine}
				/>
			))}
			<line
				x1={PLOT_LEFT}
				y1={baseline}
				x2={PLOT_RIGHT}
				y2={baseline}
				className={styles.axis}
			/>
		</>
	);
}

function AxisLabels({
	baseline,
	x,
	y,
}: {
	baseline: number;
	x: string;
	y: string;
}) {
	return (
		<>
			<text
				x={PLOT_RIGHT}
				y={baseline + 30}
				textAnchor="end"
				className={styles.axisLabel}
			>
				{x} →
			</text>
			<text
				x={16}
				y={36}
				className={styles.axisLabel}
			>
				↑ {y}
			</text>
		</>
	);
}

/** Cost per run against pass rate, for gg builds and other harnesses. */
export function CostVsPassRate() {
	const height = 380;
	const baseline = 320;
	return (
		<FigureScroll wide>
			<svg
				viewBox={`0 0 ${WIDTH} ${height}`}
				role="img"
				aria-label="Illustrative scatter: cost per run against pass rate for this experiment, the previous gg build and two other harnesses"
				className={styles.chart}
			>
				<Grid baseline={baseline} />
				<line
					x1={PLOT_LEFT}
					y1={30}
					x2={PLOT_LEFT}
					y2={baseline}
					className={styles.axis}
				/>
				<AxisLabels
					baseline={baseline}
					x="cost per run"
					y="pass"
				/>
				<path
					d="M440 222 C 400 200 370 160 352 132"
					className={styles.trail}
				/>
				<Diamond
					cx={440}
					cy={230}
					size={14}
					className={cx(styles.point, styles.previous)}
				/>
				<text
					x={460}
					y={235}
					className={styles.pointLabel}
				>
					gg [previous build]
				</text>
				<Diamond
					cx={341}
					cy={121}
					size={16}
					className={cx(styles.point, styles.current)}
				/>
				<text
					x={364}
					y={114}
					className={cx(styles.pointLabel, styles.emphasis)}
				>
					this experiment
				</text>
				<circle
					cx={720}
					cy={160}
					r={7}
					className={cx(styles.point, styles.other)}
				/>
				<text
					x={736}
					y={165}
					className={styles.pointLabel}
				>
					[Harness A]
				</text>
				<circle
					cx={600}
					cy={270}
					r={7}
					className={cx(styles.point, styles.other)}
				/>
				<text
					x={616}
					y={275}
					className={styles.pointLabel}
				>
					[Harness B]
				</text>
			</svg>
		</FigureScroll>
	);
}

/** One metric across a variable, annotated where the experiment falls behind. */
export function MetricByVariable() {
	const height = 360;
	const baseline = 300;
	return (
		<FigureScroll wide>
			<svg
				viewBox={`0 0 ${WIDTH} ${height}`}
				role="img"
				aria-label="Illustrative line chart comparing the previous gg build with this experiment across a variable, with an annotation where the experiment falls behind"
				className={styles.chart}
			>
				<Grid baseline={baseline} />
				<AxisLabels
					baseline={baseline}
					x="[variable]"
					y="[metric]"
				/>
				<path
					d="M80 220 C 240 205 400 190 560 180 C 720 172 860 168 1000 165"
					className={cx(styles.series, styles.previous)}
				/>
				<path
					d="M80 240 C 240 190 380 140 520 128 C 640 120 720 160 820 210 C 900 250 960 262 1000 268"
					className={cx(styles.series, styles.current)}
				/>
				<line
					x1={780}
					y1={190}
					x2={780}
					y2={84}
					className={styles.callout}
				/>
				<text
					x={PLOT_RIGHT}
					y={72}
					textAnchor="end"
					className={cx(styles.pointLabel, styles.emphasis)}
				>
					[Annotation: where the change stopped paying off]
				</text>
			</svg>
		</FigureScroll>
	);
}
