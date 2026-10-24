import { decidePayment } from "./payment_service.ts";

const held = decidePayment({ paymentId: "p1", customerId: "c1", amountCents: 125000, country: "US" }, true);
if (held.status !== "held" || !held.notify) throw new Error("enabled risk review must hold a large payment");
const approved = decidePayment({ paymentId: "p2", customerId: "c1", amountCents: 125000, country: "US" }, false);
if (approved.status !== "approved" || approved.notify) throw new Error("disabled risk review must approve without notification");
console.log("payment decision test passed");
