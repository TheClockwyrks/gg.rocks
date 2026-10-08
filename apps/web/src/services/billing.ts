export interface BillingDetails {
	name: string;
	cardBrand: string;
	cardLast4: string;
	/** Month and year the card expires, e.g. "08/28". */
	cardExpiry: string;
	address: string[];
}

export interface Subscription {
	planName: string;
	/** Monthly price in US dollars. */
	price: number;
	/** "cancelling": cancelled, but paid up until `endsOn`. */
	status: "active" | "cancelling";
	/** Dates are ISO strings. */
	startedOn: string;
	nextChargeOn: string | null;
	endsOn: string | null;
	billing: BillingDetails;
}

export interface Charge {
	id: string;
	date: string;
	description: string;
	/** In US dollars. */
	amount: number;
	status: "paid" | "refunded" | "failed";
}

/** Subscription and payment data for the logged-in user. */
export interface BillingService {
	/** Null when the account has never subscribed. */
	getSubscription(): Promise<Subscription | null>;
	cancelSubscription(): Promise<Subscription>;
	/** Every charge applied to the account, newest first. */
	getCharges(): Promise<Charge[]>;
}
