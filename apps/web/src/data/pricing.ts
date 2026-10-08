export interface Plan {
	id: string;
	name: string;
	price: string;
	/** What the price is charged per, e.g. a seat or a month. */
	unit: string;
	summary: string;
	features: string[];
	/** Label of the plan's call to action. */
	action: string;
	/** Marks the plan the page steers people towards. */
	featured?: boolean;
}

export interface PricingQuestion {
	question: string;
	answer: string;
}

const features = ["[Included feature]", "[Included feature]", "[Usage limit]"];

// Placeholder content until real pricing is decided.
export const plans: Plan[] = [
	{
		id: "plan-1",
		name: "[Plan name]",
		price: "[price]",
		unit: "[billing unit]",
		summary: "[Who this plan is for]",
		features,
		action: "[Call to action]",
	},
	{
		id: "plan-2",
		name: "[Plan name]",
		price: "[price]",
		unit: "[billing unit]",
		summary: "[Who this plan is for]",
		features: ["Everything in [Plan name]", ...features],
		action: "[Call to action]",
		featured: true,
	},
	{
		id: "plan-3",
		name: "[Plan name]",
		price: "[price]",
		unit: "[billing unit]",
		summary: "[Who this plan is for]",
		features: ["Everything in [Plan name]", ...features],
		action: "[Call to action]",
	},
];

export const pricingQuestions: PricingQuestion[] = [
	{ question: "[Pricing question]", answer: "[Answer]" },
	{ question: "[Pricing question]", answer: "[Answer]" },
	{ question: "[Pricing question]", answer: "[Answer]" },
];
