import { useCallback, useState } from "react";
import { AuthError } from "@/services/auth";

/** What to tell the visitor when a request to a service fails. */
export const errorMessage = (error: unknown): string =>
  error instanceof AuthError
    ? error.message
    : "Something went wrong. Please try again.";

/** Runs a request made from a form or button, tracking its progress. */
export function useAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Resolves to whether the request succeeded. */
  const run = useCallback(async (request: () => Promise<unknown>) => {
    setPending(true);
    setError(null);
    try {
      await request();
      return true;
    } catch (caught) {
      setError(errorMessage(caught));
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, error, setError, run };
}
