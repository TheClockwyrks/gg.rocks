import { DataTable } from "@/components/DataTable/DataTable";
import { billingService } from "@/services";
import type { Charge } from "@/services/billing";
import { formatDate, formatDollars } from "@/utils/format";
import { useLoaded } from "@/utils/useLoaded";
import { AccountStatus } from "./AccountSection";
import styles from "./Account.module.scss";

const loadCharges = () => billingService.getCharges();

const statusLabels: Record<Charge["status"], string> = {
	paid: "Paid",
	refunded: "Refunded",
	failed: "Failed",
};

export function Billing() {
	const [state] = useLoaded(loadCharges);

	if (state.status === "loading")
		return <AccountStatus>Loading…</AccountStatus>;
	if (state.status === "failed") {
		return <AccountStatus>{state.message}</AccountStatus>;
	}
	if (state.data.length === 0) {
		return (
			<AccountStatus>No charges have been made to this account.</AccountStatus>
		);
	}

	return (
		<section className={styles.full}>
			<h2 className={styles.srOnly}>Billing history</h2>
			<DataTable
				columns={["Date", "Description", "Amount", "Status"]}
				rows={state.data.map((charge) => ({
					key: charge.id,
					cells: [
						formatDate(charge.date),
						charge.description,
						formatDollars(charge.amount),
						statusLabels[charge.status],
					],
					tone: charge.status === "paid" ? undefined : "muted",
				}))}
			/>
		</section>
	);
}
