export interface Plan {
	id: string;
	name: string;
	/** Monthly price in US dollars. */
	price: number;
	summary: string;
	features: string[];
}

/** A set of plans aimed at one kind of user. */
export interface PlanGroup {
	id: string;
	label: string;
	summary: string;
	plans: Plan[];
}

// Placeholder content, apart from the prices, until the plans are decided.
const plan = (price: number): Plan => ({
	id: `plan-${price}`,
	name: "[Plan name]",
	price,
	summary: "[Who this plan is for]",
	features: ["[Included feature]", "[Included feature]", "[Usage limit]"],
});

export const planGroups: PlanGroup[] = [
	{
		id: "casual",
		label: "Casual",
		summary: "[Who the casual plans suit]",
		plans: [plan(20), plan(50)],
	},
	{
		id: "professional",
		label: "Professional",
		summary: "[Who the professional plans suit]",
		plans: [plan(100), plan(200), plan(500)],
	},
];
