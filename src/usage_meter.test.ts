import assert from "node:assert/strict";
import { meterCustomer } from "./usage_meter.js";

const result = meterCustomer({ customer_id: "cus_42", order_id: "ord_7", kind: "fulfillment", units: 3 });
assert.deepEqual(result, { customer_id: "cus_42", units: 3, metric: "orders.fulfillment" });
console.log("meter decision: fulfillment adds 3 units to cus_42");
