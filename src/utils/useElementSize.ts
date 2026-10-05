import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export interface Size {
	width: number;
	height: number;
}

/** Tracks the rendered size of an element; null until it has been measured. */
export function useElementSize<T extends HTMLElement>(): [
	RefObject<T | null>,
	Size | null,
] {
	const ref = useRef<T>(null);
	const [size, setSize] = useState<Size | null>(null);

	useLayoutEffect(() => {
		const element = ref.current;
		if (!element) return;

		const measure = () => {
			const { width, height } = element.getBoundingClientRect();
			setSize((previous) =>
				previous?.width === width && previous.height === height
					? previous
					: { width, height },
			);
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	return [ref, size];
}
