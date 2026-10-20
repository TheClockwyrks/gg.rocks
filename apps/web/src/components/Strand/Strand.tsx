import { useId } from "react";
import { cx } from "@/utils/cx";
import { Diamond } from "./Diamond";
import styles from "./Strand.module.scss";

const NODE_SIZE = 8;
const CURRENT_NODE_SIZE = 12;
const WAVE_AMPLITUDE = 5;
const WAVE_LENGTH = 80;

/** A gently wavering vertical line down the centre of the strand. */
function wavyPath(centre: number, height: number): string {
  let d = `M${centre} 0`;
  let direction = -1;
  for (let y = 0; y < height; y += WAVE_LENGTH) {
    const end = Math.min(y + WAVE_LENGTH, height);
    const third = (end - y) / 3;
    const offset = direction * WAVE_AMPLITUDE;
    d += ` C ${centre + offset} ${y + third} ${centre - offset} ${end - third} ${centre} ${end}`;
    direction = -direction;
  }
  return d;
}

interface StrandProps {
  width: number;
  height: number;
  /** Vertical position of each node, top to bottom. */
  nodes: number[];
  /** Index of the node that is lit, or -1 for none. */
  current: number;
  /** "accent" glows up to the current node; "muted" is a quiet progress line. */
  tone: "accent" | "muted";
  /** Fill in the nodes above the current one, as progress. */
  fillPassed?: boolean;
  className?: string;
}

/**
 * A vertical strand of the gg network with a diamond per stop. Used as the
 * mini-map of site sections and as the table-of-contents progress line.
 */
export function Strand({
  width,
  height,
  nodes,
  current,
  tone,
  fillPassed = false,
  className,
}: StrandProps) {
  const clipId = useId();
  const centre = width / 2;
  const path = wavyPath(centre, height);
  const litHeight = nodes[current] ?? 0;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <clipPath id={clipId}>
        <rect
          width={width}
          className={styles.reveal}
          style={{ height: litHeight }}
        />
      </clipPath>
      <path d={path} className={styles.base} />
      <g className={cx(tone === "accent" && styles.glow)}>
        <path
          d={path}
          clipPath={`url(#${clipId})`}
          className={cx(styles.lit, styles[tone])}
        />
      </g>
      {nodes.map((y, index) => (
        <Diamond
          key={y}
          cx={centre}
          cy={y}
          size={index === current ? CURRENT_NODE_SIZE : NODE_SIZE}
          className={cx(
            styles.node,
            index === current && styles.current,
            fillPassed && index < current && styles.passed,
          )}
        />
      ))}
    </svg>
  );
}
