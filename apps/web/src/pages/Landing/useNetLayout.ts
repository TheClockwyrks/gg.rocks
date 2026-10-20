import { useSyncExternalStore } from "react";
import { layoutForWidth, type NetLayout } from "./layouts";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

const getSnapshot = (): NetLayout => layoutForWidth(window.innerWidth);

/** The network arrangement that suits the current viewport width. */
export function useNetLayout(): NetLayout {
  return useSyncExternalStore(subscribe, getSnapshot);
}
