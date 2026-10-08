import { useEffect, useState } from "react";
import { errorMessage } from "./useAction";

type Loaded<T> =
	| { status: "loading" }
	| { status: "failed"; message: string }
	| { status: "ready"; data: T };

/**
 * Fetches data once when the component mounts. `load` must be a stable
 * function, such as a service method.
 */
export function useLoaded<T>(
	load: () => Promise<T>,
): [Loaded<T>, (data: T) => void] {
	const [state, setState] = useState<Loaded<T>>({ status: "loading" });

	useEffect(() => {
		let stale = false;
		load().then(
			(data) => {
				if (!stale) setState({ status: "ready", data });
			},
			(error: unknown) => {
				if (!stale)
					setState({
						status: "failed",
						message: errorMessage(error),
					});
			},
		);
		return () => {
			stale = true;
		};
	}, [load]);

	return [state, (data) => setState({ status: "ready", data })];
}
