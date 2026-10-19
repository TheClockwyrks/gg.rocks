import { useEffect, useState } from "react";
import { writeUpDeltas } from "@/data/experiments";
import { seriesLabel, type ExperimentFile } from "@/data/runData";
import {
  baselineResult,
  experimentResult,
  harnessLabel,
  type WriteUpData,
} from "@/data/writeUps/types";
import { formatTimestamp, NO_DATA } from "@/utils/format";
import {
  ComparedAgainst,
  DataLinks,
  Lineage,
  Method,
  Prose,
  Section,
} from "./blocks";
import { ResultFigures } from "./ResultFigures";
import { Verdict } from "./Verdict";
import { WriteUpFrame } from "./WriteUpFrame";

const toc = [
  { id: "verdict", label: "Verdict" },
  { id: "changed", label: "What changed" },
  { id: "results", label: "Results" },
  { id: "discussion", label: "Discussion" },
  { id: "lineage", label: "Lineage" },
  { id: "data", label: "Data" },
];

const SAMPLE_NOTICE =
  "Sample data: every run behind this page was invented, to show the layout with enough runs to fill each chart. Bracketed text is what gets written for each experiment.";

/**
 * The experiment write-up: the gg build under test against the last build
 * that shipped, on the runs they share. The frame and every figure are fixed;
 * a new experiment supplies its pull and prose (see `data/writeUps`). The
 * verdict is drawn at once from the summary, and the rest once the pull
 * behind the charts has been fetched.
 */
export function ComparisonWriteUp({ data }: { data: WriteUpData }) {
  const [file, setFile] = useState<ExperimentFile | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let current = true;
    data.load().then(
      (loaded) => current && setFile(loaded),
      () => current && setFailed(true),
    );
    return () => {
      current = false;
    };
  }, [data]);

  const baseline = baselineResult(data);
  const deltas = writeUpDeltas(data);

  return (
    <WriteUpFrame
      name={data.name}
      status={data.status}
      outcome={data.outcome}
      timeline={`gg ${experimentResult(data).version ?? NO_DATA} against ${baseline ? harnessLabel(baseline) : "no baseline"} · data pulled ${formatTimestamp(data.pulledAt)}`}
      notice={data.synthetic ? SAMPLE_NOTICE : undefined}
      toc={toc}
    >
      <Verdict
        status={data.status}
        summary={data.verdict}
        stats={[
          { value: deltas.passRate, label: "Pass rate" },
          { value: deltas.cost, label: "Cost per run" },
          { value: deltas.tokens, label: "Tokens per run" },
          { value: deltas.cacheHit, label: "Cached share" },
        ]}
        basis={
          baseline
            ? `Deltas vs. ${harnessLabel(baseline)}, on the runs both builds share. ${data.sample}`
            : `The baseline has no runs in common with this build, so there is nothing to measure against yet. ${data.sample}`
        }
      />
      {file ? (
        <Sections data={data} file={file} />
      ) : (
        <Method>
          {failed
            ? "The runs behind this page could not be loaded."
            : "Loading the runs behind this page…"}
        </Method>
      )}
    </WriteUpFrame>
  );
}

/** Everything below the verdict, which needs the full pull. */
function Sections({ data, file }: { data: WriteUpData; file: ExperimentFile }) {
  const baseline = file.series.find((series) => series.role === "baseline");

  return (
    <>
      <ComparedAgainst
        baselines={
          baseline
            ? [`${seriesLabel(baseline)} · the last build that shipped`]
            : []
        }
        note={`Measured on runs pulled from The Test Cabinet on ${formatTimestamp(data.pulledAt)}. How gg stands against other harnesses is on the benchmarks page.`}
      />

      <Section id="changed" title="What changed">
        {data.whatChanged.map((paragraph) => (
          <Prose key={paragraph}>{paragraph}</Prose>
        ))}
      </Section>

      <Section
        id="results"
        title="Results"
        lead={
          <Method>
            {data.sample} {data.spread}
          </Method>
        }
        spacious
      >
        <ResultFigures file={file} against="baseline" />
      </Section>

      <Section id="discussion" title="Discussion">
        {data.discussion.map((paragraph) => (
          <Prose key={paragraph}>{paragraph}</Prose>
        ))}
      </Section>

      <Section id="lineage" title="Lineage">
        <Lineage steps={data.lineage} />
      </Section>

      <Section id="data" title="Data">
        <DataLinks links={data.dataLinks} />
      </Section>
    </>
  );
}
