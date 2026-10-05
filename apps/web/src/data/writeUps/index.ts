import { sharedPrefixFanOut } from "./sharedPrefixFanOut";
import { template } from "./template";
import type { WriteUpData } from "./types";

/** Write-ups that use the standard layout, newest first. */
export const writeUps: WriteUpData[] = [sharedPrefixFanOut, template];
