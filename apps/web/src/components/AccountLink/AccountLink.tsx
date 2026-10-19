import { Link } from "react-router";
import { useAuth } from "@/auth/AuthProvider";
import { accountPaths } from "@/data/site";
import { cx } from "@/utils/cx";
import styles from "./AccountLink.module.scss";

/** The button that reads "Log in", or "Account" for someone logged in. */
export function AccountLink({ className }: { className?: string }) {
  const { status } = useAuth();
  const authenticated = status === "authenticated";

  return (
    <Link
      to={authenticated ? accountPaths.account : accountPaths.login}
      // Holds its place, unseen, until the session is known, so the label
      // does not flip from one to the other as the page loads.
      aria-hidden={status === "loading" || undefined}
      tabIndex={status === "loading" ? -1 : undefined}
      className={cx(
        styles.link,
        status === "loading" && styles.pending,
        className,
      )}
    >
      {authenticated ? "Account" : "Log in"}
    </Link>
  );
}
