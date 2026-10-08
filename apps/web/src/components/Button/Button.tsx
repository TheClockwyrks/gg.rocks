import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/utils/cx";
import styles from "./Button.module.scss";

interface ButtonProps extends Omit<
	ButtonHTMLAttributes<HTMLButtonElement>,
	"className"
> {
	variant?: "primary" | "outline" | "danger";
}

export function Button({
	variant = "outline",
	type = "button",
	...rest
}: ButtonProps) {
	return (
		<button
			type={type}
			className={cx(styles.button, styles[variant])}
			{...rest}
		/>
	);
}
