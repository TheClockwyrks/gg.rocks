import { NavLink, Outlet } from "react-router";
import { useAuth } from "@/auth/AuthProvider";
import { PageBody } from "@/components/PageBody/PageBody";
import { PageIntro } from "@/components/PageIntro/PageIntro";
import { accountPaths } from "@/data/site";
import { cx } from "@/utils/cx";
import styles from "./Account.module.scss";

const tabs = [
  { label: "My account", path: accountPaths.account },
  { label: "Subscription", path: accountPaths.subscription },
  { label: "Billing history", path: accountPaths.billing },
];

/** Frame shared by the account pages: heading, tab bar and the open tab. */
export function AccountLayout() {
  const { user } = useAuth();

  return (
    <PageBody>
      <PageIntro eyebrow="Account" title="Your account">
        Logged in as {user?.email}.
      </PageIntro>

      <div>
        <nav aria-label="Account" className={styles.tabs}>
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end
              className={({ isActive }) =>
                cx(styles.tab, isActive && styles.current)
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </PageBody>
  );
}
