import { PageBody } from "@/components/PageBody/PageBody";
import { PageIntro } from "@/components/PageIntro/PageIntro";
import { PlaceholderLink } from "@/components/PlaceholderLink/PlaceholderLink";
import { plans, pricingQuestions } from "@/data/pricing";
import { cx } from "@/utils/cx";
import styles from "./Pricing.module.scss";

export function Pricing() {
	return (
		<PageBody rail="pricing">
			<PageIntro
				eyebrow="Pricing"
				title="What gg costs"
			>
				[One or two sentences on how gg is priced, and what stays free while it
				is in pre-release.]
			</PageIntro>

			<ul className={styles.plans}>
				{plans.map((plan) => (
					<li
						key={plan.id}
						className={cx(styles.plan, plan.featured && styles.featured)}
					>
						<div className={styles.heading}>
							<h2 className={styles.name}>{plan.name}</h2>
							{plan.featured && (
								<span className={styles.flag}>Recommended</span>
							)}
						</div>
						<p className={styles.cost}>
							<span className={styles.price}>{plan.price}</span>
							<span className={styles.unit}>/ {plan.unit}</span>
						</p>
						<p className={styles.summary}>{plan.summary}</p>
						<ul className={styles.features}>
							{plan.features.map((feature, index) => (
								<li
									key={index}
									className={styles.feature}
								>
									{feature}
								</li>
							))}
						</ul>
						<PlaceholderLink className={styles.action}>
							{plan.action}
						</PlaceholderLink>
					</li>
				))}
			</ul>

			<section className={styles.questions}>
				<h2 className={styles.questionsTitle}>Questions</h2>
				<dl className={styles.list}>
					{pricingQuestions.map((item, index) => (
						<div
							key={index}
							className={styles.item}
						>
							<dt className={styles.question}>{item.question}</dt>
							<dd className={styles.answer}>{item.answer}</dd>
						</div>
					))}
				</dl>
			</section>
		</PageBody>
	);
}
