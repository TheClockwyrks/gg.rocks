const MINUS = "−";

function signed(value: number, digits: number): string {
	const rounded = Math.abs(value).toFixed(digits);
	if (Number(rounded) === 0) return rounded;
	return `${value < 0 ? MINUS : "+"}${rounded}`;
}

/** Stands in for a figure there is no data for. */
export const NO_DATA = "–";

type Figure = number | null | undefined;

/** A relative change between two values, e.g. "−24.1%". */
export function formatChange(from: Figure, to: Figure): string {
	if (from == null || to == null) return NO_DATA;
	return `${signed(((to - from) / from) * 100, 1)}%`;
}

/** A difference between two percentages, e.g. "+3.7 pts". */
export function formatPoints(from: Figure, to: Figure, digits = 1): string {
	if (from == null || to == null) return NO_DATA;
	return `${signed(to - from, digits)} pts`;
}

export const formatPercent = (value: Figure, digits = 1): string =>
	value == null ? NO_DATA : `${value.toFixed(digits)}%`;

export const formatDollars = (value: Figure): string =>
	value == null ? NO_DATA : `$${value.toFixed(2)}`;

/** A token count held in thousands, e.g. "412k" or "7.27M". */
export function formatThousands(value: Figure): string {
	if (value == null) return NO_DATA;
	return value >= 1000
		? `${(value / 1000).toFixed(2)}M`
		: `${Math.round(value)}k`;
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

/** A calendar date from an ISO string, e.g. "Oct 7, 2026". */
export const formatDate = (iso: string): string =>
	dateFormat.format(new Date(iso));

const dayFormat = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
	hour: "2-digit",
	minute: "2-digit",
	hourCycle: "h23",
	timeZone: "UTC",
});

/** The UTC day of an ISO timestamp, e.g. "7 Oct 2026". */
export const formatDay = (iso: string): string =>
	dayFormat.format(new Date(iso));

/**
 * An ISO timestamp to the minute in UTC, e.g. "7 Oct 2026, 00:37 UTC", for
 * saying when a set of figures was gathered.
 */
export const formatTimestamp = (iso: string): string =>
	`${formatDay(iso)}, ${timeFormat.format(new Date(iso))} UTC`;
