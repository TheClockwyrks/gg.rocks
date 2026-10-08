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
