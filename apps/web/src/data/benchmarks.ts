import summary from "@run-data/sample/benchmark/summary.json";
import type { BenchmarkFile } from "./runData";

/**
 * The shape of a benchmark's summary.json: which gg build the figures are for,
 * when they were gathered and what they rest on. It ships with the page, so
 * that this much shows before the figures themselves have loaded.
 */
export interface BenchmarkSummary {
  /** When the runs were read from The Test Cabinet, as an ISO timestamp. */
  pulledAt: string;
  /** Every run was invented, to show the page with a full set of data. */
  synthetic: boolean;
  /** The gg version the figures are for. */
  version: string | null;
  models: number;
  cases: number;
  pairs: number;
  runs: number;
  /** How many other harnesses share at least one pair with gg. */
  harnesses: number;
}

/**
 * The pull the benchmarks page is drawn from, written by
 * scripts/run-data/gg-benchmark-data.py. To update the page after a new gg
 * build ships, run the script and point both imports at the directory it
 * wrote.
 *
 * For now this is the sample, whose runs are invented. The one real pull so
 * far is run-data/benchmarks/0.7.0/2026-10-08, which has too few runs to fill
 * the page.
 */
export const benchmark: {
  summary: BenchmarkSummary;
  load: () => Promise<BenchmarkFile>;
} = {
  summary,
  load: () =>
    import("@run-data/sample/benchmark/benchmark.json").then(
      (module) => module.default as unknown as BenchmarkFile,
    ),
};
