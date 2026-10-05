import type { ReactNode } from "react";

interface PlaceholderLinkProps {
	className?: string;
	children: ReactNode;
}

/**
 * A link whose destination does not exist yet (downloads, external Test
 * Cabinet pages). It looks and focuses like a link but goes nowhere.
 */
export function PlaceholderLink({ className, children }: PlaceholderLinkProps) {
	return (
		<a
			href="#"
			className={className}
			onClick={(event) => event.preventDefault()}
		>
			{children}
		</a>
	);
}
