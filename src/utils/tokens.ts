import exported from "@/styles/tokens.module.scss";

const px = (name: string): number => Number.parseFloat(exported[name] ?? "0");

/** Design token values shared with the stylesheets (in pixels). */
export const tokens = {
	bpNetMedium: px("bpNetMedium"),
	bpLg: px("bpLg"),
	tapTarget: px("tapTarget"),
	railWidth: px("railWidth"),
} as const;
