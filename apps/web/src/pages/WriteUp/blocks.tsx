import { Fragment, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import { PlaceholderLink } from "@/components/PlaceholderLink/PlaceholderLink";
import { ratings, type LineageStep, type Rating } from "@/data/writeUps/types";
import { cx } from "@/utils/cx";
import styles from "./blocks.module.scss";

// --- Sections ---------------------------------------------------------------

interface SectionProps {
	id: string;
	title: string;
	/** Line of context under the heading. */
	lead?: ReactNode;
	/** Leave more room between children, for sections made of figures. */
	spacious?: boolean;
	children: ReactNode;
}

export function Section({ id, title, lead, spacious, children }: SectionProps) {
	return (
		<section
			id={id}
			className={cx(styles.section, spacious && styles.spacious)}
		>
			<div className={styles.sectionHeader}>
				<h2 className={styles.sectionTitle}>{title}</h2>
				{lead}
			</div>
			{children}
		</section>
	);
}

export function Prose({ children }: { children: ReactNode }) {
	return <p className={styles.prose}>{children}</p>;
}

/** Small print: how a section's numbers were gathered. */
export function Method({ children }: { children: ReactNode }) {
	return <p className={styles.method}>{children}</p>;
}

// --- Compared against -------------------------------------------------------

interface ComparedAgainstProps {
	baselines: string[];
	note: string;
}

export function ComparedAgainst({ baselines, note }: ComparedAgainstProps) {
	return (
		<section className={styles.compared}>
			<h2 className={styles.comparedLabel}>Compared against</h2>
			<ul className={styles.chips}>
				{baselines.map((baseline) => (
					<li
						key={baseline}
						className={styles.chip}
					>
						{baseline}
					</li>
				))}
			</ul>
			<p className={styles.comparedNote}>{note}</p>
		</section>
	);
}

// --- Bars ------------------------------------------------------------------

interface BarRowProps {
	label: string;
	/** Summary of the bar, shown at its end. */
	value: string;
	highlight?: boolean;
	children: ReactNode;
}

/** One labelled bar, split into segments, in a set of comparable bars. */
function BarRow({ label, value, highlight, children }: BarRowProps) {
	return (
		<div className={cx(styles.barRow, highlight && styles.highlight)}>
			<span className={styles.barLabel}>{label}</span>
			<div className={styles.bar}>{children}</div>
			<span className={styles.barValue}>{value}</span>
		</div>
	);
}

const share = (value: number): CSSProperties =>
	({ "--share": value }) as CSSProperties;

export interface TokenBar {
	label: string;
	/** Percentage of tokens served from cache, 0-100. */
	cached: number;
	highlight?: boolean;
}

/** How each harness's tokens split between cached and uncached. */
export function TokenBars({ bars }: { bars: TokenBar[] }) {
	return (
		<div className={styles.bars}>
			{bars.map((bar) => (
				<BarRow
					key={bar.label}
					label={bar.label}
					value={`${bar.cached}% cached`}
					highlight={bar.highlight}
				>
					<span
						className={cx(styles.segment, styles.cached)}
						style={share(bar.cached)}
						title={`Cached: ${bar.cached}%`}
					/>
					<span
						className={cx(styles.segment, styles.uncached)}
						style={share(100 - bar.cached)}
						title={`Uncached: ${100 - bar.cached}%`}
					/>
				</BarRow>
			))}
		</div>
	);
}

/** Segments narrower than this share of the bar have no room for a label. */
const MIN_LABELLED_SHARE = 8;

export interface RatingBar {
	label: string;
	counts: Record<Rating, number>;
	highlight?: boolean;
}

/** The make-up of functionality ratings across each harness's test runs. */
export function RatingBars({ bars }: { bars: RatingBar[] }) {
	return (
		<div className={styles.bars}>
			{bars.map((bar) => {
				const total = ratings.reduce((sum, { id }) => sum + bar.counts[id], 0);
				const percent = (id: Rating) => (bar.counts[id] / total) * 100;
				const strong = Math.round(percent("great") + percent("flawless"));
				return (
					<BarRow
						key={bar.label}
						label={bar.label}
						value={`${strong}% great or better`}
						highlight={bar.highlight}
					>
						{ratings.map(({ id, label }) => {
							const rounded = Math.round(percent(id));
							return (
								<span
									key={id}
									className={cx(styles.segment, styles[id])}
									style={share(bar.counts[id])}
									title={`${label}: ${bar.counts[id]} of ${total} runs (${rounded}%)`}
								>
									{rounded >= MIN_LABELLED_SHARE && `${rounded}%`}
								</span>
							);
						})}
					</BarRow>
				);
			})}
		</div>
	);
}

// --- Before / after ---------------------------------------------------------

export interface DesignStep {
	label: string;
	change?: "changed" | "added";
}

export interface DesignVariant {
	label: string;
	current?: boolean;
	steps: DesignStep[];
}

/** Two pipelines side by side, with the steps that differ picked out. */
export function BeforeAfter({ variants }: { variants: DesignVariant[] }) {
	return (
		<figure className={styles.beforeAfter}>
			{variants.map((variant) => (
				<div
					key={variant.label}
					className={styles.variant}
				>
					<span
						className={cx(
							styles.variantLabel,
							variant.current && styles.current,
						)}
					>
						{variant.label}
					</span>
					<ol className={styles.steps}>
						{variant.steps.map((step, index) => (
							<Fragment key={index}>
								{index > 0 && (
									<li
										className={styles.arrow}
										aria-hidden="true"
									>
										↓
									</li>
								)}
								<li
									className={cx(
										styles.step,
										step.change && styles[step.change],
									)}
								>
									{step.label}
									{step.change && (
										<span className={styles.stepChange}> · {step.change}</span>
									)}
								</li>
							</Fragment>
						))}
					</ol>
				</div>
			))}
		</figure>
	);
}

// --- Lineage ----------------------------------------------------------------

function LineageCard({ step }: { step: LineageStep }) {
	const className = cx(
		styles.lineageCard,
		styles[step.tone],
		step.kind === "self" && styles.self,
	);
	const content = (
		<>
			<span className={styles.relation}>{step.relation}</span>
			<span className={styles.lineageName}>{step.name}</span>
		</>
	);

	if (step.kind === "link" && step.to) {
		return (
			<Link
				to={step.to}
				className={className}
			>
				{content}
			</Link>
		);
	}
	if (step.kind === "pending") {
		return <PlaceholderLink className={className}>{content}</PlaceholderLink>;
	}
	return <div className={className}>{content}</div>;
}

/** A short strand between two cards: across when side by side, else down. */
function Connector({ lit }: { lit?: boolean }) {
	return (
		<span className={cx(styles.connector, lit && styles.lit)}>
			<svg
				width="90"
				height="24"
				viewBox="0 0 90 24"
				className={styles.across}
				aria-hidden="true"
			>
				<path d="M0 12 C 30 12 50 6 90 12" />
			</svg>
			<svg
				width="24"
				height="32"
				viewBox="0 0 24 32"
				className={styles.down}
				aria-hidden="true"
			>
				<path d="M12 0 C 8 10 16 22 12 32" />
			</svg>
		</span>
	);
}

/** The experiments this one grew from and led to, joined by strands. */
export function Lineage({ steps }: { steps: LineageStep[] }) {
	return (
		<ol className={styles.lineage}>
			{steps.map((step, index) => (
				<li
					key={step.relation}
					className={styles.lineageStep}
				>
					<LineageCard step={step} />
					{index < steps.length - 1 && <Connector lit={step.lit} />}
				</li>
			))}
		</ol>
	);
}

// --- Data links -------------------------------------------------------------

export function DataLinks({ links }: { links: string[] }) {
	return (
		<ul className={styles.dataLinks}>
			{links.map((label) => (
				<li key={label}>
					<PlaceholderLink className={styles.dataLink}>{label}</PlaceholderLink>
				</li>
			))}
		</ul>
	);
}
