import type { AuthService, Credentials } from "./auth";
import type { BillingService } from "./billing";
import { mockAuth } from "./mock/mockAuth";
import { mockBilling } from "./mock/mockBilling";
import { demoUser } from "./mock/store";

// The one place that decides which implementations the site runs against.
// Swap the mocks for the real services here once they exist.

export const authService: AuthService = mockAuth;
export const billingService: BillingService = mockBilling;

/** Credentials shown on the log-in page while the mock is in use, or null. */
export const demoCredentials: Credentials | null = {
  email: demoUser.email,
  password: demoUser.password,
};
