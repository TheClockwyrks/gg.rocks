import { useId, type InputHTMLAttributes } from "react";
import styles from "./Field.module.scss";

interface FieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "id"
> {
  label: string;
  /** Short note under the input, e.g. what a password must contain. */
  hint?: string;
}

/** A labelled text input. */
export function Field({ label, hint, ...input }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        aria-describedby={hint ? hintId : undefined}
        {...input}
      />
      {hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
    </div>
  );
}
