import { useEffect, useState } from "react";

/** How far down the viewport a section must reach to count as being read. */
const READING_LINE = 0.35;

/** Tracks which of the given sections the reader has scrolled to. */
export function useActiveSection(ids: string[]): string | undefined {
	const [active, setActive] = useState(ids[0]);
	const key = ids.join(" ");

	useEffect(() => {
		const sectionIds = key.split(" ");

		const update = () => {
			const line = window.innerHeight * READING_LINE;
			let current = sectionIds[0];
			for (const id of sectionIds) {
				const element = document.getElementById(id);
				if (element && element.getBoundingClientRect().top <= line) {
					current = id;
				}
			}
			const page = document.documentElement;
			if (window.innerHeight + window.scrollY >= page.scrollHeight - 2) {
				current = sectionIds.at(-1);
			}
			setActive(current);
		};

		update();
		window.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);
		return () => {
			window.removeEventListener("scroll", update);
			window.removeEventListener("resize", update);
		};
	}, [key]);

	return active;
}
