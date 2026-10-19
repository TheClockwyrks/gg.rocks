import { cx } from "@/utils/cx";
import styles from "./SegmentedControl.module.scss";

interface SegmentedControlProps<T extends string> {
  /** Describes what the buttons choose between, for assistive technology. */
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: "regular" | "small";
}

/** A row of pill buttons of which exactly one is selected. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "regular",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx(styles.group, styles[size])}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          className={cx(styles.option, option.id === value && styles.pressed)}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
