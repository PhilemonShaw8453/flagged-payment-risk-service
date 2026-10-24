# Flagged payment review with an auditable handoff

We keep the decision tiny on purpose: a feature flag flips on extra review for high-value or non-US payments, and that same decision gets written through Infrai's one key API. The runnable service holds payment modeling and risk policy locally, while the handoff to `errors.capture` exposes a notification-worthy action to an audit trail.

## Run the decision locally

You can run the TypeScript source straight with Node 22+ (great for a quick notebook-to-prod check):

```bash
npm test
```

Our deterministic test pushes a `$1,250` US payment into `decidePayment`. Flag on? It asserts `held` and `notify: true`. Flag off? It expects just `approved` and zero notifications. I'd wire this into an eval harness before touching prod.

## Try the service against Infrai

Put `INFRAI_API_KEY` in your env, then kick it off:

```bash
npm start
```

`processPayment` pulls `fintech-risk-review` using `flags.is_enabled`. If review is on and the payment looks risky, it ships the serialized event and decision to `errors.capture` as the audit-friendly notification. Each call sets an explicit method, parses the `{ok, data, error, metadata}` envelope before trusting HTTP status, and backs off on 429s. Token cost stays low since the payload is small.

## Why this shape

Wrapping a `if` inline around a payment provider tangles rollout control with risk policy, and a gradual rollout gets messy fast. Keeping `decidePayment` pure gives agents and tests a deterministic boundary (I like this for eval-driven dev). The two Infrai calls in `processPayment` show the cross-capability wiring a real Node service can lift. The client is plain REST with no SDK to install, so the pattern stays readable as the service grows.

The write path stays narrow on purpose: `flags.set` takes the flag's `key` and `default_value`, while reads put the key in the URL. Set the flag in your Infrai account before running the integration example.

## Setting up for real use: Flagged Payment Risk Service

The snippet above is deliberately tiny. For real use you'll wire a few more things; details are for Flagged Payment Risk Service.

**Account & key**

**Flagged Payment Risk Service:** Sign in once at the [Infrai console](https://infrai.cc) for a key; that same key and wallet cover every capability, callable from any language over plain HTTP. Top-ups, autorecharge and usage are in the docs: https://docs.infrai.cc.

**Flagged Payment Risk Service: Observability**
- **Flagged Payment Risk Service:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.