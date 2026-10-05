const MINUS = "−";

function signed(value: number, digits: number): string {
	const rounded = Math.abs(value).toFixed(digits);
	if (Number(rounded) === 0) return rounded;
	return `${value < 0 ? MINUS : "+"}${rounded}`;
}

/** A relative change between two values, e.g. "−24.1%". */
export function formatChange(from: number, to: number): string {
	return `${signed(((to - from) / from) * 100, 1)}%`;
}

/** A difference between two percentages, e.g. "+3.7 pts". */
export function formatPoints(from: number, to: number, digits = 1): string {
	return `${signed(to - from, digits)} pts`;
}

export const formatPercent = (value: number, digits = 1): string =>
	`${value.toFixed(digits)}%`;

export const formatDollars = (value: number): string => `$${value.toFixed(2)}`;

/** A token count held in thousands, e.g. "412k". */
export const formatThousands = (value: number): string =>
	`${Math.round(value)}k`;
