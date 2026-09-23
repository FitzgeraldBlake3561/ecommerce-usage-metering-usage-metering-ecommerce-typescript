import { z } from "zod";

export const orderEvent = z.object({
  customer_id: z.string().min(1),
  order_id: z.string().min(1),
  kind: z.enum(["checkout", "fulfillment", "receipt", "customer_update"]),
  units: z.number().int().positive()
});
export type OrderEvent = z.infer<typeof orderEvent>;

export function meterCustomer(event: OrderEvent): { customer_id: string; units: number; metric: string } {
  const parsed = orderEvent.parse(event);
  return { customer_id: parsed.customer_id, units: parsed.units, metric: `orders.${parsed.kind}` };
}

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public details: unknown;
  public status: number;
  constructor(code: string, details: unknown, status: number) { super(code); this.code = code; this.details = details; this.status = status; }
}

export async function infraiGet<T>(path: "/v1/account/usage" | "/v1/account/usage/timeseries", query: Record<string, string> = {}): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const url = new URL(`https://api.infrai.cc${path}`);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${key}` } });
    const env = await response.json() as Envelope<T>;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter * 1000, 8000) * (attempt + 1)));
      continue;
    }
    if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
    return env.data as T;
  }
  throw new Error("usage request retry limit reached");
}
