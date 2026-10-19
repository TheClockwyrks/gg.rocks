import { planGroups } from "@/data/pricing";
import { AuthError } from "@/services/auth";
import type { BillingService, Charge, Subscription } from "@/services/billing";
import { demoUser, latency, readSessionUser } from "./store";

// Only the demo account has a subscription; accounts made through the sign-up
// form have none, which is what the pages show before a first purchase.

const MONTHS_SUBSCRIBED = 5;

const plan = planGroups.flatMap((group) => group.plans)[1]!;

/** The same day of the month, `months` away from today. */
function monthsFromNow(months: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  // Clamped so that every month has the day.
  date.setDate(Math.min(date.getDate(), 28));
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

// Cancelling lasts until the page is reloaded.
let cancelled = false;

function subscription(): Subscription {
  const nextChargeOn = monthsFromNow(1);
  return {
    planName: plan.name,
    price: plan.price,
    status: cancelled ? "cancelling" : "active",
    startedOn: monthsFromNow(1 - MONTHS_SUBSCRIBED),
    nextChargeOn: cancelled ? null : nextChargeOn,
    endsOn: cancelled ? nextChargeOn : null,
    billing: {
      name: "[Cardholder name]",
      cardBrand: "Visa",
      cardLast4: "4242",
      cardExpiry: "08/28",
      address: ["[Street address]", "[City, postcode]", "[Country]"],
    },
  };
}

const charges = (): Charge[] =>
  Array.from({ length: MONTHS_SUBSCRIBED }, (_, index) => ({
    id: `charge-${MONTHS_SUBSCRIBED - index}`,
    date: monthsFromNow(-index),
    description: `Vantacloud ${plan.name}`,
    amount: plan.price,
    status: "paid",
  }));

function subscribed(): boolean {
  const user = readSessionUser();
  if (!user) {
    throw new AuthError("unauthenticated", "You are no longer logged in.");
  }
  return user.id === demoUser.id;
}

export const mockBilling: BillingService = {
  async getSubscription() {
    await latency();
    return subscribed() ? subscription() : null;
  },

  async cancelSubscription() {
    await latency();
    if (!subscribed()) throw new Error("There is no subscription to cancel.");
    cancelled = true;
    return subscription();
  },

  async getCharges() {
    await latency();
    return subscribed() ? charges() : [];
  },
};
