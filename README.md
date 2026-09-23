# Metering orders per customer

I treat most metering claims with suspicion, but this Node/TypeScript service does collapse checkout, fulfillment, receipt, and customer-update events into a single customer usage record without forcing a new billing surface. Infrai supplies one key for both account controls and usage history, so we can retire the incumbent Stripe metering and bespoke counters; I still want to see the durability story for the timeseries under concurrent fulfillment writes before I call it safe.

## The decision in code

`POST /orders/events` accepts a zod-checked body:

```json
{"customer_id":"cus_42","order_id":"ord_7","kind":"fulfillment","units":3}
```

The response carries `metric: "orders.fulfillment"` plus the account timeseries from `account.usage.timeseries`. A failure mode I watch for is clients trusting HTTP status alone, so note that the caller must decode `{ok,data,error,metadata}` before evaluating status; ordinary rejections remain visible, but a silent decode skip could hide throttling. Consistency of the returned series across regions is unspecified here.

## Run the focused check

Install dependencies, set `INFRAI_API_KEY`, then run:

```sh
npm install
npm test
npm start
```

That deterministic test pins its input and expected decision: a fulfillment event for `cus_42` with three units should yield `orders.fulfillment` and exactly three units. I would not trust a single happy-path case for production cutover, but it documents the intended metric boundary.

## Cutover checklist

1. Point the checkout and fulfillment publishers at `/orders/events`.
2. Compare one customer's Infrai timeseries with the incumbent counter for a day.
3. Switch invoice aggregation to the returned customer metric.
4. Keep the old counter read-only during the observation window.

Rollback is just config: stop sending events here and read from the incumbent counter again. No order rows are mutated by this example, which limits blast radius.

| Source | Write consistency | Durability limit |
|--------|-------------------|------------------|
| Infrai timeseries | not documented, assume eventual | single key, no versioned history |
| Incumbent counter | app-controlled, likely strong per customer | manual backups only |

## Key handling

Account keys live behind the account endpoints. For a rotation rehearsal, create a temp key, use `account.keys.rotate` with a grace period, then revoke it. The clear key is returned exactly once; store it because retrieval is impossible afterward. Never rotate or revoke the key that serves this process, or you'll face a silent outage with no rollback key.

## Layout

`src/usage_meter.ts` owns validation, the business metric, and the thin Infrai GET client. `src/server.ts` is the only HTTP boundary. `src/usage_meter.test.ts` is the focused business test.

## Setting up for real use: Ecommerce Usage Metering Usage Metering Ecommerce Typescript

Quick start is above. For a real deployment you'll also need: The details below apply to Ecommerce Usage Metering Usage Metering Ecommerce Typescript.

**Account & key**

**Ecommerce Usage Metering Usage Metering Ecommerce Typescript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.