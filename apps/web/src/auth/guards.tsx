import { Navigate, Outlet, useLocation, useSearchParams } from "react-router";
import { accountPaths } from "@/data/site";
import { useAuth } from "./AuthProvider";

const REDIRECT_PARAM = "redirect";

/** Adds the page to return to after logging in to a log-in or sign-up path. */
export function withRedirect(path: string, target: string | null): string {
  if (!target || target === accountPaths.account) return path;
  return `${path}?${new URLSearchParams({ [REDIRECT_PARAM]: target })}`;
}

/**
 * The page asked for in the address, if it is one of ours. Anything else is
 * ignored, so a crafted link cannot send someone off-site after they log in.
 */
export function useRedirectTarget(): string | null {
  const [params] = useSearchParams();
  const target = params.get(REDIRECT_PARAM);
  return target && /^\/(?![/\\])/.test(target) ? target : null;
}

/**
 * Wraps the routes that need a session and sends everyone else to log in.
 * This only keeps the pages out of the way: what protects the account is the
 * service refusing to answer without a valid session.
 */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return null;
  if (status === "anonymous") {
    return (
      <Navigate
        to={withRedirect(
          accountPaths.login,
          location.pathname + location.search,
        )}
        replace
      />
    );
  }
  return <Outlet />;
}

/**
 * Wraps the log-in and sign-up pages. Someone who already has a session, or
 * has just been given one by the form, moves on to the page they were after.
 */
export function GuestOnly() {
  const { status } = useAuth();
  const target = useRedirectTarget();

  if (status === "loading") return null;
  if (status === "authenticated") {
    return <Navigate to={target ?? accountPaths.account} replace />;
  }
  return <Outlet />;
}
