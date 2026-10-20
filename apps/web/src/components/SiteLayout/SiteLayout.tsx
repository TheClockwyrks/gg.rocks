import { Outlet } from "react-router";
import { SiteHeader } from "@/components/SiteHeader/SiteHeader";
import styles from "./SiteLayout.module.scss";

/** Frame shared by every page behind the landing page: top bar plus content. */
export function SiteLayout() {
  return (
    <div className={styles.shell}>
      <SiteHeader />
      <Outlet />
    </div>
  );
}
