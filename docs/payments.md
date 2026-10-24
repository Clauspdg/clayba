# Payments — Cash and PayPal

CLAYBA offers two payment methods at booking: **cash** and **PayPal**. Every
money movement goes through Cloud Functions (`functions/src/payments`) —
clients never write `payments`, `wallets`, `transactions` or `commissions`
(`firestore.rules`).

## Who earns what

The fare breakdown (`calculateFare`, see [pricing-engine.md](pricing-engine.md))
already itemizes the price. On every completed ride:

| Share          | Formula                                                                   |
| -------------- | ------------------------------------------------------------------------- |
| Passenger pays | `total`                                                                   |
| Driver earns   | `total − commission − bookingFee − serviceFee` (`driverEarningsFromFare`) |
| Platform keeps | `total − driver earnings` (commission + booking fee + service fee)        |

`packages/utils/src/payments/settlement.ts` holds this math (unit-tested). The
same function computes the `estimatedEarnings` a driver sees on a ride offer,
so the offer and the actual credit always match.

## Cash

1. Passenger picks **Cash** → the `tripRequest` is created at
   `searching_driver` with `paymentMethod: "cash"`; dispatch starts at once
   (`onTripRequestCreated`).
2. Driver completes the ride → `completeTrip` freezes the final fare, then
   `settleCompletedTrip`:
   - writes `payments/{tripRequestId}` as `captured` (collected in hand);
   - **debits** the driver's wallet the platform's share
     (`transactions/trip_{tripId}_settlement`, type `commission`);
   - writes `commissions/{tripId}`.
3. The driver app shows **"Collect $X in cash"**.

A driver's wallet balance going **negative** is money they owe CLAYBA. When
they hand it over, an admin uses **Wallets → Record cash deposit**
(`recordDriverCashDeposit` callable: ledger entry + audit log).

## PayPal (authorize at booking, capture at completion)

```
passenger            web/app                 Cloud Functions                 PayPal
   │  choose PayPal     │                            │                          │
   │──────────────────▶│ create tripRequest          │                          │
   │                    │ (status: confirmed)        │                          │
   │                    │── createPaypalOrder ──────▶│── create AUTHORIZE order ▶│
   │◀── redirect to PayPal approval page ────────────│◀── approval URL ─────────│
   │── approves ────────────────────────────────────────────────────────────────▶│
   │◀── /payment/paypal/return (web) ── deep link theride://paypal/return (app) ─│
   │                    │── authorizePaypalOrder ───▶│── authorize (hold) ──────▶│
   │                    │                            │ request → searching_driver│
   │                    │                            │ dispatch starts           │
   ...ride...
   │                    │   driver: completeTrip ───▶│── capture final fare ────▶│
   │                    │                            │ credit driver wallet       │
```

- The amount held is computed **server-side**: the larger of the client's
  estimate and the fare over the straight-line distance — a tampered estimate
  can't shrink the hold.
- At completion the **final** fare is captured. PayPal allows capturing up to
  115% of the hold (max +$75); above that the ceiling is captured and the
  shortfall is logged on the payment (`failureReason: capture_shortfall:…`).
- The driver's wallet is **credited** their earnings.
- `firestore.rules` only accepts a PayPal `tripRequest` at `confirmed`, so a
  PayPal ride can't reach dispatch without a hold.

### When the hold is released (void)

| Situation                                                                                 | Released by                                                     |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Passenger cancels on PayPal's page                                                        | `/payment/paypal/cancel` cancels the booking (nothing was held) |
| Booking cancelled / expired                                                               | `onTripRequestUpdatedForPayments`                               |
| Ride cancelled after matching                                                             | `onTripUpdatedForPayments`                                      |
| No driver found (request left at `searching_driver` past `expiresAt`), abandoned approval | `voidStaleAuthorizations` (every 15 min)                        |

### Failures

A capture failure never undoes a completed ride: the payment is marked
`failed` (with `failureReason`), the driver is **not** credited, and the
driver's screen says support has been notified. Staff see it under
**Payments** in the admin.

## Setup

PayPal credentials are **secrets** — never put them in a `.env` file.

1. Create an app on <https://developer.paypal.com> → _Apps & Credentials_
   (start in **Sandbox**). Copy the **Client ID** and **Secret**.
2. Store them in Secret Manager (once per Firebase project):
   ```powershell
   firebase functions:secrets:set PAYPAL_CLIENT_ID --project the-ride-dev
   firebase functions:secrets:set PAYPAL_CLIENT_SECRET --project the-ride-dev
   ```
   ⚠️ Functions that talk to PayPal declare these secrets, so **the functions
   deploy fails until both exist**. To deploy before you have credentials,
   set both to `unset` — PayPal then answers "not configured" and passengers
   are asked to pay cash.
3. Non-secret parameters (`functions/.env.<project-id>`, e.g.
   `functions/.env.the-ride-dev`):
   ```
   PAYPAL_ENV=sandbox          # "live" in production
   WEB_APP_URL=https://the-ride-web-dev.web.app
   ```
   `WEB_APP_URL` is where PayPal returns the passenger (`/payment/paypal/return`).
4. Deploy: `firebase deploy --only functions,firestore:rules --project the-ride-dev`.

Test with a PayPal **sandbox personal account** (Sandbox → Accounts).

## Data

- `payments/{tripRequestId}` — one per ride: `method`, `status`
  (`pending → authorized → captured`, or `voided` / `failed`), `amount`,
  `authorizedAmount`, `capturedAmount`, `commissionAmount`, PayPal ids,
  `settledAt`.
- `wallets/{driverUid}` — created at the driver's first settled ride.
- `transactions/{idempotencyKey}` — ledger; ids are deterministic
  (`trip_{tripId}_settlement`, `deposit_{uuid}`), so retries never double-count.
- `commissions/{tripId}`.
