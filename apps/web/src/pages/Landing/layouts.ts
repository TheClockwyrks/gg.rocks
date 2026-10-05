import type { SectionId } from "@/data/site";
import { tokens } from "@/utils/tokens";

export type Point = [x: number, y: number];

/** A path that draws itself in. Times are in milliseconds. */
export interface NetStroke {
	d: string;
	delay: number;
	duration: number;
}

/** A lit tube from the wordmark (or from another node) to a node. */
export interface NetRoute extends NetStroke {
	tone: "accent" | "hot";
	weight: "trunk" | "branch";
	/** The nodes this stretch of tube leads to; it stays lit for them. */
	serves: SectionId[];
}

export interface NetNode {
	id: SectionId;
	at: Point;
	/** When the node's marker lights up. */
	delay: number;
	/** Nodes whose route passes through this one, itself included. */
	serves: SectionId[];
}

export interface NetTag {
	text: string;
	at: Point;
	serves: SectionId[];
}

/**
 * One arrangement of the landing network, drawn on a design canvas of
 * `width` x `height` and stretched to the real viewport about `origin`, the
 * point by the wordmark that everything grows from.
 */
export interface NetLayout {
	id: "wide" | "medium" | "narrow";
	width: number;
	height: number;
	origin: Point;
	/** "back": a haze explores first, then tubes form from each node back to
	 * the origin. "out": tubes grow outwards from the origin. */
	growth: "back" | "out";
	/** When the network has finished growing. */
	settled: number;
	haze: NetStroke[];
	filaments: NetStroke[];
	routes: NetRoute[];
	nodes: NetNode[];
	tag?: NetTag;
}

const FILAMENT_DURATION = 300;

const filament = (delay: number, d: string): NetStroke => ({
	d,
	delay,
	duration: FILAMENT_DURATION,
});

const haze = (duration: number, delay: number, d: string): NetStroke => ({
	d,
	delay,
	duration,
});

// --- Wide: desktop --------------------------------------------------------

const WIDE_STEM = "M140 84 C 260 80 400 110 520 150";
const WIDE_FORK = `${WIDE_STEM} C 560 230 600 330 640 420`;
const WIDE_TO_EXPERIMENTS = `${WIDE_STEM} C 640 190 720 210 860 240`;
const WIDE_TO_DOWNLOAD = `${WIDE_FORK} C 680 500 660 580 720 640`;
const WIDE_TO_BENCHMARKS = `${WIDE_FORK} C 780 430 920 520 1120 480`;
const WIDE_TO_CHANGELOG = "M860 240 C 980 260 1080 160 1240 180";
const WIDE_TO_DOCS = "M1120 480 C 1180 560 1170 680 1260 740";

const wide: NetLayout = {
	id: "wide",
	width: 1440,
	height: 900,
	origin: [140, 84],
	growth: "back",
	settled: 1100,
	haze: [
		haze(550, 0, WIDE_TO_EXPERIMENTS),
		haze(690, 0, WIDE_TO_DOWNLOAD),
		haze(880, 0, WIDE_TO_BENCHMARKS),
		haze(840, 0, `${WIDE_TO_EXPERIMENTS} C 980 260 1080 160 1240 180`),
		haze(1100, 0, `${WIDE_TO_BENCHMARKS} C 1180 560 1170 680 1260 740`),
		haze(300, 290, "M520 150 C 600 90 680 60 760 40"),
		haze(300, 510, "M640 420 C 760 360 880 320 1000 300"),
		haze(250, 510, "M640 420 C 600 520 600 600 560 700"),
		haze(200, 550, "M860 240 C 940 160 1000 100 1060 60"),
		haze(250, 690, "M720 640 C 800 720 900 760 1000 820"),
	],
	filaments: [
		filament(150, "M330 104 C 350 40 420 30 480 20"),
		filament(30, "M180 86 C 200 140 180 190 210 230"),
		filament(440, "M720 212 C 740 140 700 90 760 40"),
		filament(510, "M640 420 C 600 470 590 520 560 560"),
		filament(690, "M720 640 C 760 720 740 790 800 870"),
		filament(840, "M1240 180 C 1320 150 1360 110 1420 120"),
		filament(770, "M980 500 C 1000 400 1040 380 1010 320"),
		filament(880, "M1120 480 C 1220 430 1330 450 1420 400"),
		filament(1100, "M1260 740 C 1330 790 1380 800 1430 870"),
	],
	routes: [
		{
			d: WIDE_TO_EXPERIMENTS,
			delay: 550,
			duration: 350,
			tone: "accent",
			weight: "trunk",
			serves: ["experiments", "changelog"],
		},
		{
			d: WIDE_TO_DOWNLOAD,
			delay: 690,
			duration: 400,
			tone: "accent",
			weight: "trunk",
			serves: ["download"],
		},
		{
			d: WIDE_TO_BENCHMARKS,
			delay: 880,
			duration: 450,
			tone: "accent",
			weight: "trunk",
			serves: ["benchmarks", "docs"],
		},
		{
			d: WIDE_TO_CHANGELOG,
			delay: 840,
			duration: 250,
			tone: "hot",
			weight: "branch",
			serves: ["changelog"],
		},
		{
			d: WIDE_TO_DOCS,
			delay: 1100,
			duration: 220,
			tone: "accent",
			weight: "branch",
			serves: ["docs"],
		},
	],
	nodes: [
		{
			id: "experiments",
			at: [860, 240],
			delay: 550,
			serves: ["experiments", "changelog"],
		},
		{
			id: "benchmarks",
			at: [1120, 480],
			delay: 880,
			serves: ["benchmarks", "docs"],
		},
		{ id: "download", at: [720, 640], delay: 690, serves: ["download"] },
		{ id: "changelog", at: [1240, 180], delay: 840, serves: ["changelog"] },
		{ id: "docs", at: [1260, 740], delay: 1100, serves: ["docs"] },
	],
	tag: { text: "ships →", at: [1085, 202], serves: ["changelog"] },
};

// --- Medium: tablets and unfolded foldables -------------------------------

const MEDIUM_STEM = "M64 44 C 160 40 280 60 380 96";
const MEDIUM_FORK = `${MEDIUM_STEM} C 380 180 360 260 400 340`;

const medium: NetLayout = {
	id: "medium",
	width: 720,
	height: 800,
	origin: [64, 44],
	growth: "out",
	settled: 890,
	haze: [],
	filaments: [
		filament(820, "M600 120 C 650 90 680 60 712 40"),
		filament(730, "M110 500 C 80 580 120 650 90 760"),
		filament(890, "M520 560 C 580 620 640 650 700 720"),
		filament(600, "M400 340 C 420 420 380 470 420 520"),
	],
	routes: [
		{
			d: `${MEDIUM_STEM} C 420 120 430 170 470 190`,
			delay: 250,
			duration: 350,
			tone: "accent",
			weight: "trunk",
			serves: ["experiments", "changelog"],
		},
		{
			d: `${MEDIUM_FORK} C 450 360 500 320 540 330`,
			delay: 250,
			duration: 420,
			tone: "accent",
			weight: "trunk",
			serves: ["benchmarks", "docs"],
		},
		{
			d: `${MEDIUM_FORK} C 340 400 180 420 110 500`,
			delay: 250,
			duration: 480,
			tone: "accent",
			weight: "trunk",
			serves: ["download"],
		},
		{
			d: "M540 330 C 580 400 560 500 520 560",
			delay: 670,
			duration: 220,
			tone: "accent",
			weight: "branch",
			serves: ["docs"],
		},
		{
			d: "M470 190 C 520 200 550 120 600 120",
			delay: 600,
			duration: 220,
			tone: "hot",
			weight: "branch",
			serves: ["changelog"],
		},
	],
	nodes: [
		{
			id: "benchmarks",
			at: [540, 330],
			delay: 670,
			serves: ["benchmarks", "docs"],
		},
		{
			id: "experiments",
			at: [470, 190],
			delay: 600,
			serves: ["experiments", "changelog"],
		},
		{ id: "changelog", at: [600, 120], delay: 820, serves: ["changelog"] },
		{ id: "download", at: [110, 500], delay: 730, serves: ["download"] },
		{ id: "docs", at: [520, 560], delay: 890, serves: ["docs"] },
	],
};

// --- Narrow: phones and folded foldables ----------------------------------

const NARROW_STEM = "M30 58 C 22 130 38 210 30 290";
const NARROW_TRUNK = `${NARROW_STEM} C 26 380 36 470 34 520`;

const narrow: NetLayout = {
	id: "narrow",
	width: 390,
	height: 844,
	origin: [30, 58],
	growth: "out",
	settled: 620,
	haze: [],
	filaments: [
		filament(300, "M40 390 C 14 400 8 420 2 430"),
		filament(420, "M34 520 C 10 560 6 600 2 640"),
		filament(600, "M236 520 C 280 560 320 600 386 640"),
		filament(600, "M236 520 C 280 500 330 470 386 460"),
		filament(620, "M150 660 C 220 690 290 700 380 750"),
		filament(620, "M70 660 C 60 720 80 770 70 840"),
	],
	routes: [
		{
			d: `${NARROW_STEM} C 32 310 44 326 60 330`,
			delay: 0,
			duration: 350,
			tone: "accent",
			weight: "trunk",
			serves: ["benchmarks"],
		},
		{
			d: `${NARROW_STEM} C 26 330 34 370 40 390 C 80 410 130 405 176 420`,
			delay: 0,
			duration: 420,
			tone: "accent",
			weight: "trunk",
			serves: ["experiments", "changelog"],
		},
		{
			d: `${NARROW_TRUNK} C 36 540 50 556 70 560`,
			delay: 0,
			duration: 480,
			tone: "accent",
			weight: "trunk",
			serves: ["download"],
		},
		{
			d: `${NARROW_TRUNK} C 32 600 40 640 70 660 C 100 676 130 664 150 660`,
			delay: 0,
			duration: 600,
			tone: "accent",
			weight: "trunk",
			serves: ["docs"],
		},
		{
			d: "M176 420 C 172 460 200 500 236 520",
			delay: 420,
			duration: 200,
			tone: "hot",
			weight: "branch",
			serves: ["changelog"],
		},
	],
	nodes: [
		{ id: "benchmarks", at: [60, 330], delay: 350, serves: ["benchmarks"] },
		{
			id: "experiments",
			at: [176, 420],
			delay: 420,
			serves: ["experiments", "changelog"],
		},
		{ id: "changelog", at: [236, 520], delay: 620, serves: ["changelog"] },
		{ id: "download", at: [70, 560], delay: 480, serves: ["download"] },
		{ id: "docs", at: [150, 660], delay: 600, serves: ["docs"] },
	],
};

export const layouts = { wide, medium, narrow };

export function layoutForWidth(viewportWidth: number): NetLayout {
	if (viewportWidth >= tokens.bpLg) return wide;
	if (viewportWidth >= tokens.bpNetMedium) return medium;
	return narrow;
}

/** How far along an axis a design coordinate sits, from origin (0) to edge (1). */
export function fraction(layout: NetLayout, [x, y]: Point): Point {
	const [ox, oy] = layout.origin;
	return [(x - ox) / (layout.width - ox), (y - oy) / (layout.height - oy)];
}

/**
 * Re-plots a path from design coordinates into a viewport of the given size.
 * Scaling the coordinates (rather than the drawing) keeps line weights and
 * markers undistorted at any aspect ratio.
 */
export function scalePath(
	layout: NetLayout,
	d: string,
	width: number,
	height: number,
): string {
	const [ox, oy] = layout.origin;
	const scaleX = (width - ox) / (layout.width - ox);
	const scaleY = (height - oy) / (layout.height - oy);
	let index = 0;
	return d.replace(/-?\d+(?:\.\d+)?/g, (match) => {
		const value = Number(match);
		const scaled =
			index++ % 2 === 0
				? ox + (value - ox) * scaleX
				: oy + (value - oy) * scaleY;
		return scaled.toFixed(1);
	});
}

export function scalePoint(
	layout: NetLayout,
	point: Point,
	width: number,
	height: number,
): Point {
	const [ox, oy] = layout.origin;
	const [fx, fy] = fraction(layout, point);
	return [ox + fx * (width - ox), oy + fy * (height - oy)];
}
