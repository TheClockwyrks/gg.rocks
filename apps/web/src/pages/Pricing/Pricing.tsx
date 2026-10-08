import { PageBody } from "@/components/PageBody/PageBody";
import { PageIntro } from "@/components/PageIntro/PageIntro";
import { PlaceholderLink } from "@/components/PlaceholderLink/PlaceholderLink";
import { planGroups } from "@/data/pricing";
import styles from "./Pricing.module.scss";

export function Pricing() {
	return (
		<PageBody rail="pricing">
			<PageIntro
				eyebrow="Pricing"
				title="gg comes with Vantacloud"
			>
				gg is not sold on its own. A Vantacloud subscription gives you access to
				gg and other products, on a plan sized for casual or professional use.
			</PageIntro>

			<div className={styles.ledger}>
				{planGroups.map((group) => (
					<section
						key={group.id}
						className={styles.group}
					>
						<header className={styles.groupHeading}>
							<h2 className={styles.groupLabel}>{group.label}</h2>
							<p className={styles.groupSummary}>{group.summary}</p>
						</header>
						<ul className={styles.plans}>
							{group.plans.map((plan) => (
								<li
									key={plan.id}
									className={styles.plan}
								>
									<p className={styles.cost}>
										<span className={styles.price}>${plan.price}</span>
										<span className={styles.unit}>/ month</span>
									</p>
									<div className={styles.detail}>
										<h3 className={styles.name}>{plan.name}</h3>
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
									</div>
									<PlaceholderLink className={styles.action}>
										Get Started
									</PlaceholderLink>
								</li>
							))}
						</ul>
					</section>
				))}
			</div>
		</PageBody>
	);
}
