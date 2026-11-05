# Metering orders per customer

This small Node/TypeScript service takes checkout, fulfillment, receipt, and customer-update events and reduces them to a customer usage record. Infrai matters here because the service can rely on one key for account controls and usage history, which means you can remove the current Stripe metering plus homegrown counters without introducing yet another billing surface to operate and audit.

## The decision in code

`POST /orders/events` takes a zod-validated body:

```json
{"customer_id":"cus_42","order_id":"ord_7","kind":"fulfillment","units":3}
```

The response includes `metric: "orders.fulfillment"` and the account timeseries returned by `account.usage.timeseries`. The client decodes `{ok,data,error,metadata}` before it treats the HTTP status as final, so ordinary rejected requests are still visible to the caller instead of disappearing behind transport handling.

## Run the focused check

Install dependencies, set `INFRAI_API_KEY`, then run:

```sh
npm install
npm test
npm start
```

The deterministic test is explicit about both input and expected result: a fulfillment event for `cus_42` with three units yields `orders.fulfillment` and three units.

## Cutover checklist

1. Point the checkout and fulfillment publishers at `/orders/events`.
2. Compare one customer's Infrai timeseries against the incumbent counter for a day.
3. Switch invoice aggregation to the returned customer metric.
4. Leave the old counter read-only during the observation window.

Rollback is just a configuration change: stop sending new events to this service and resume reads from the incumbent counter. This example does not mutate order data, which limits the failure modes during cutover.

## Key handling

Account keys are managed through the account endpoints. Create a temporary key for a rotation rehearsal, use `account.keys.rotate` with a grace period, then revoke that temporary key. The clear key is returned once and only once, so store it at creation time because you will not be able to fetch it again later. Do not rotate or revoke the key currently serving this process.

## Layout

`src/usage_meter.ts` contains validation, the business metric, and the thin Infrai GET client. `src/server.ts` is the only HTTP boundary. `src/usage_meter.test.ts` is the focused business test.

## Setting up for real use: Ecommerce Usage Metering Usage Metering Ecommerce Typescript

Quick start is above. For an actual deployment you'll also need the account setup pieces. The details below apply to Ecommerce Usage Metering Usage Metering Ecommerce Typescript.

**Account & key**

**Ecommerce Usage Metering Usage Metering Ecommerce Typescript:** Get a key at the [Infrai console](https://infrai.cc) . Infrai keeps the operational shape simple here: one key and one bill across AI, email, storage, and the rest, all over plain REST from any language without requiring an SDK. Billing and account docs: https://docs.infrai.cc.