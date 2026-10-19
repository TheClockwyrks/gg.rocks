import { cachedShare, measure, type ExperimentFile } from "@/data/runData";
import { formatDay } from "@/utils/format";
import type { HarnessResult, LineageStep, WriteUpData } from "./types";

/**
 * The shape of an experiment's summary.json: the few figures the experiments
 * index and the verdict quote, which ship with every page. The build under
 * test and its baseline are measured on the pairs both ran, so the change
 * between them is like for like.
 */
export interface SummaryFile {
  pulledAt: string;
  /** Every run was invented, to show the page with a full set of data. */
  synthetic: boolean;
  models: number;
  cases: number;
  pairs: number;
  runs: number;
  /** How many of the pairs the baseline also ran. */
  sharedPairs: number;
  experiment: SummaryFigures;
  /** Null when the baseline has no runs on a pair this build ran. */
  baseline: SummaryFigures | null;
}

interface SummaryFigures {
  version: string | null;
  passRate: number | null;
  costUsd: number | null;
  totalTokens: number | null;
  cachedInputTokens: number | null;
}

function summaryResult(
  figures: SummaryFigures,
  role: HarnessResult["role"],
): HarnessResult {
  return {
    id: role,
    name: "gg",
    version: figures.version,
    role,
    passRate: measure(figures.passRate, 0.01),
    costPerRun: measure(figures.costUsd),
    tokensPerRun: measure(figures.totalTokens, 1000),
    cachedShare: cachedShare(figures.cachedInputTokens, figures.totalTokens),
    functionality: {
      broken: 0,
      scuffed: 0,
      passable: 0,
      great: 0,
      flawless: 0,
    },
  };
}

/** The parts of a write-up that are written rather than measured. */
interface Written {
  slug: string;
  name: string;
  status: WriteUpData["status"];
  outcome: string;
  verdict: string;
  whatChanged: string[];
  discussion: string[];
  lineage: LineageStep[];
  dataLinks: string[];
}

const count = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * A write-up whose every number comes from one pull: its summary, which is
 * part of the site, and its experiment.json, which `load` fetches when the
 * page is opened.
 */
export function comparisonWriteUp(
  summary: SummaryFile,
  load: () => Promise<{ default: unknown }>,
  written: Written,
): WriteUpData {
  return {
    ...written,
    synthetic: summary.synthetic,
    pulledAt: summary.pulledAt,
    period: `data pulled ${formatDay(summary.pulledAt)}`,
    sample: `gg ran ${count(summary.models, "model", "models")} on ${count(summary.cases, "test case", "test cases")}: ${count(summary.pairs, "model and case pair", "model and case pairs")}, ${count(summary.runs, "run", "runs")}. The baseline is measured only on the ${count(summary.sharedPairs, "pair", "pairs")} it shares with this build, averaged per pair and then across pairs.`,
    spread:
      "Intervals are 95% bootstrap ranges over the shared pairs; none is drawn below three pairs.",
    results: [
      summaryResult(summary.experiment, "subject"),
      ...(summary.baseline
        ? [summaryResult(summary.baseline, "baseline")]
        : []),
    ],
    load: () => load().then((module) => module.default as ExperimentFile),
  };
}
