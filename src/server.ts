import { createServer } from "node:http";
import { meterCustomer, orderEvent, infraiGet, InfraiError } from "./usage_meter.js";

const port = Number(process.env.PORT ?? 3000);
const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/orders/events") { response.writeHead(404).end("Not found"); return; }
    try {
      const body = await new Promise<string>((resolve, reject) => { let raw = ""; request.on("data", (chunk) => raw += chunk); request.on("end", () => resolve(raw)); request.on("error", reject); });
      const event = orderEvent.parse(JSON.parse(body));
      const meter = meterCustomer(event);
      const usage = await infraiGet("/v1/account/usage/timeseries", { customer_id: meter.customer_id });
      response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ meter, usage }));
    } catch (error) {
      if (error instanceof InfraiError) { response.writeHead(error.status >= 400 && error.status < 500 ? error.status : 502, { "content-type": "application/json" }).end(JSON.stringify({ ok: false, error: { code: error.code, details: error.details } })); return; }
      response.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ ok: false, error: { code: "INVALID_ARGUMENT" } }));
    }
});
server.listen(port, () => console.log(`order meter listening on http://localhost:${port}`));
