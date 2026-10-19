import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/Button/Button";
import { Notice } from "@/components/Notice/Notice";
import { sections } from "@/data/site";
import { billingService } from "@/services";
import type { Subscription as SubscriptionData } from "@/services/billing";
import { cx } from "@/utils/cx";
import { formatDate, formatDollars } from "@/utils/format";
import { useAction } from "@/utils/useAction";
import { useLoaded } from "@/utils/useLoaded";
import { AccountSection, AccountStatus } from "./AccountSection";
import styles from "./Account.module.scss";

const loadSubscription = () => billingService.getSubscription();

const statusLabels: Record<SubscriptionData["status"], string> = {
  active: "Active",
  cancelling: "Cancelled",
};

interface CancelProps {
  subscription: SubscriptionData;
  onCancelled: (subscription: SubscriptionData) => void;
}

function Cancel({ subscription, onCancelled }: CancelProps) {
  const { pending, error, run } = useAction();
  const [confirming, setConfirming] = useState(false);

  if (subscription.status === "cancelling") {
    return (
      <p className={styles.text}>
        Your subscription has been cancelled.
        {subscription.endsOn &&
          ` You keep access until ${formatDate(subscription.endsOn)}.`}
      </p>
    );
  }

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Cancel subscription
      </Button>
    );
  }

  return (
    <>
      <p className={styles.text}>
        Cancel your subscription?
        {subscription.nextChargeOn &&
          ` You will not be charged again, and keep access until ${formatDate(subscription.nextChargeOn)}.`}
      </p>
      {error && <Notice tone="error">{error}</Notice>}
      <div className={styles.actions}>
        <Button
          variant="danger"
          disabled={pending}
          onClick={() =>
            void run(async () =>
              onCancelled(await billingService.cancelSubscription()),
            )
          }
        >
          Yes, cancel
        </Button>
        <Button disabled={pending} onClick={() => setConfirming(false)}>
          Keep subscription
        </Button>
      </div>
    </>
  );
}

export function Subscription() {
  const [state, setSubscription] = useLoaded(loadSubscription);

  if (state.status === "loading")
    return <AccountStatus>Loading…</AccountStatus>;
  if (state.status === "failed") {
    return <AccountStatus>{state.message}</AccountStatus>;
  }
  if (!state.data) {
    return (
      <AccountStatus>
        You do not have a subscription.{" "}
        <Link to={sections.pricing.path}>See the plans</Link>.
      </AccountStatus>
    );
  }

  const subscription = state.data;
  const { billing } = subscription;

  return (
    <>
      <AccountSection title="Current plan">
        <div className={styles.plan}>
          <span className={styles.planName}>{subscription.planName}</span>
          <span className={cx(styles.pill, styles[subscription.status])}>
            {statusLabels[subscription.status]}
          </span>
        </div>
        <p className={styles.text}>
          <span className={styles.price}>${subscription.price}</span>{" "}
          <span className={styles.unit}>/ month</span>
        </p>
        <p className={styles.text}>
          Subscribed since {formatDate(subscription.startedOn)}.
        </p>
      </AccountSection>

      <AccountSection title="Next charge">
        {subscription.nextChargeOn ? (
          <p className={styles.text}>
            {formatDollars(subscription.price)} on{" "}
            {formatDate(subscription.nextChargeOn)}.
          </p>
        ) : (
          <p className={styles.text}>No further charges.</p>
        )}
      </AccountSection>

      <AccountSection title="Billing information">
        <dl className={styles.details}>
          <dt>Name</dt>
          <dd>{billing.name}</dd>
          <dt>Card</dt>
          <dd>
            {billing.cardBrand} ending in {billing.cardLast4}, expires{" "}
            {billing.cardExpiry}
          </dd>
          <dt>Billing address</dt>
          <dd>
            {billing.address.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </dd>
        </dl>
      </AccountSection>

      <AccountSection
        title="Cancel subscription"
        summary="Stops future charges."
      >
        <Cancel subscription={subscription} onCancelled={setSubscription} />
      </AccountSection>
    </>
  );
}
