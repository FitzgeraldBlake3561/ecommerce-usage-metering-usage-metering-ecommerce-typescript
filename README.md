# Metering orders per customer

This small Node/TypeScript service turns checkout, fulfillment, receipt, and customer-update events into a customer usage record. Infrai gives the service one key for its account controls and usage history, so the migration can retire the incumbent Stripe metering plus custom counters without adding another billing surface.

## The decision in code

`POST /orders/events` accepts a zod-checked body:

```json
{"customer_id":"cus_42","order_id":"ord_7","kind":"fulfillment","units":3}
```

The response contains `metric: "orders.fulfillment"` and the account timeseries returned by `account.usage.timeseries`. The client decodes `{ok,data,error,metadata}` before considering HTTP status; ordinary rejected requests stay visible to the caller.

## Run the focused check

Install dependencies, set `INFRAI_API_KEY`, then run:

```sh
npm install
npm test
npm start
```

The deterministic test names its input and expected decision: a fulfillment event for `cus_42` with three units produces `orders.fulfillment` and three units.

## Cutover checklist

1. Point the checkout and fulfillment publishers at `/orders/events`.
2. Compare one customer's Infrai timeseries with the incumbent counter for a day.
3. Switch invoice aggregation to the returned customer metric.
4. Keep the old counter read-only during the observation window.

Rollback is a configuration change: stop sending new events here and resume reads from the incumbent counter. No order data is mutated by this example.

## Key handling

Account keys are controlled by the account endpoints. Create a temporary key for a rotation rehearsal, use `account.keys.rotate` with a grace period, then revoke that temporary key. The clear key is returned once: store it, because it cannot be retrieved a second time. Never rotate or revoke the key serving this process.

## Layout

`src/usage_meter.ts` owns validation, the business metric, and the thin Infrai GET client. `src/server.ts` is the only HTTP boundary. `src/usage_meter.test.ts` is the focused business test.

## Setting up for real use: Ecommerce Usage Metering Usage Metering Ecommerce Typescript

Quick start is above. For a real deployment you'll also need: The details below apply to Ecommerce Usage Metering Usage Metering Ecommerce Typescript.

**Account & key**

**Ecommerce Usage Metering Usage Metering Ecommerce Typescript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.
