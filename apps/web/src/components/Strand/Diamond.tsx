import type { CSSProperties } from "react";

interface DiamondProps {
  cx: number;
  cy: number;
  size: number;
  className?: string;
  style?: CSSProperties;
}

/** The rounded diamond that marks a node on a strand. For use inside an SVG. */
export function Diamond({ cx, cy, size, className, style }: DiamondProps) {
  return (
    <rect
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      rx={size / 5}
      transform={`rotate(45 ${cx} ${cy})`}
      className={className}
      style={style}
    />
  );
}
