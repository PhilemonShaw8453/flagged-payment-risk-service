import { infrai } from "./infrai_client.ts";

export type PaymentEvent = { paymentId: string; customerId: string; amountCents: number; country: string };
export type PaymentDecision = { status: "approved" | "held"; notify: boolean; reason: string };

export function decidePayment(event: PaymentEvent, flagEnabled: boolean): PaymentDecision {
  const risky = event.amountCents >= 100000 || event.country !== "US";
  if (flagEnabled && risky) return { status: "held", notify: true, reason: "risk review required" };
  return { status: "approved", notify: flagEnabled, reason: "standard processing" };
}

export async function processPayment(event: PaymentEvent): Promise<PaymentDecision> {
  let enabled = false;
  try {
    enabled = await infrai.flags.is_enabled("fintech-risk-review");
  } catch (error) {
    if (!(error instanceof Error) || !((error as { code?: string }).code === "FLAG_NOT_FOUND")) throw error;
  }
  const decision = decidePayment(event, Boolean(enabled));
  if (decision.notify) {
    try { await infrai.errors.capture(JSON.stringify({ event, decision })); }
    catch (error) { console.error("audit capture failed", error); }
  }
  return decision;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const event: PaymentEvent = { paymentId: "pay_demo_001", customerId: "cust_42", amountCents: 125000, country: "US" };
  processPayment(event).then((decision) => console.log(JSON.stringify({ event, decision })));
}
