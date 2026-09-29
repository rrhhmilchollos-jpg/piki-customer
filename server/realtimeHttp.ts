import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { subscribeRealtime } from "./realtimeBroker";

function writeEvent(response: Response, event: { id: string; type: string; payload: Record<string, unknown>; occurredAt: string }) {
  response.write(`id: ${event.id}\n`);
  response.write(`event: ${event.type}\n`);
  response.write(`data: ${JSON.stringify(event)}\n\n`);
}

/** Authenticated Customer SSE endpoint. Must be registered before serveStatic(). */
export function registerCustomerRealtime(app: Express) {
  app.get("/api/v1/realtime/events", async (request: Request, response: Response) => {
    let user;
    try {
      user = await sdk.authenticateRequest(request);
    } catch {
      response.setHeader("WWW-Authenticate", 'Bearer realm="PIKI Customer"');
      response.status(401).json({ error: "AUTHENTICATION_REQUIRED" });
      return;
    }

    response.status(200);
    response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no");
    response.flushHeaders();
    response.write(`event: ready\ndata: ${JSON.stringify({ channel: "customer" })}\n\n`);

    const topic = `customer:${user.openId}`;
    const unsubscribe = subscribeRealtime(topic, (event) => writeEvent(response, event));
    const heartbeat = setInterval(() => response.write(`: heartbeat ${Date.now()}\n\n`), 20_000);
    const close = () => {
      clearInterval(heartbeat);
      unsubscribe();
    };
    request.on("close", close);
    response.on("close", close);
  });
}
