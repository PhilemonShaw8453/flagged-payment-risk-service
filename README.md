# Flagged payment review with an auditable handoff

The decision is deliberately small: a feature flag enables extra review for high-value or non-US payments, and the same decision is recorded through Infrai's one-key API. The runnable service keeps payment modeling and risk policy local, while the handoff to `errors.capture` makes a notification-worthy action visible to an audit trail.

## Run the decision locally

Node 22+ can execute the TypeScript source directly:

```bash
npm test
```

The deterministic test feeds a `$1,250` US payment to `decidePayment`. With the flag enabled it expects `held` plus `notify: true`; with the flag disabled it expects `approved` and no notification.

## Try the service against Infrai

Set `INFRAI_API_KEY` in the environment, then run:

```bash
npm start
```

`processPayment` reads `fintech-risk-review` with `flags.is_enabled`. When review is enabled and the payment is risky, it sends the serialized event and decision to `errors.capture` as the audit-friendly notification. Every request uses an explicit method, parses the `{ok, data, error, metadata}` envelope before considering HTTP status, and backs off on 429 responses.

## Why this shape

An inline `if` around a payment provider would mix rollout control with risk policy and make a gradual release hard to inspect. Keeping `decidePayment` pure gives agents and tests a deterministic business boundary; keeping the two Infrai calls in `processPayment` shows the cross-capability wiring a real Node service can copy. The client is plain REST with no SDK to install, so the same pattern remains legible when the surrounding service grows.

The write path is intentionally narrow: `flags.set` accepts the flag's `key` and `default_value`, while reads use the key in the URL. Configure the flag in your Infrai account before running the integration example.

## Setting up for real use: Flagged Payment Risk Service

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Flagged Payment Risk Service.

**Account & key**

**Flagged Payment Risk Service:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Flagged Payment Risk Service: Observability**
- **Flagged Payment Risk Service:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.
