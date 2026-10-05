import { Link } from "react-router";
import { cx } from "@/utils/cx";
import styles from "./Wordmark.module.scss";

export function Wordmark({ className }: { className?: string }) {
	return (
		<Link
			to="/"
			aria-label="gg home"
			className={cx(styles.wordmark, className)}
		>
			gg
		</Link>
	);
}
