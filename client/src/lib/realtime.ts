export type CustomerRealtimeEvent = { id?: string; type: string; payload: Record<string, unknown>; occurredAt?: string };

/** Fetch-based SSE supports authenticated headers/cookies and Last-Event-ID replay. */
export function connectCustomerRealtime(onEvent: (event: CustomerRealtimeEvent) => void) {
  const controller = new AbortController();
  const storageKey = "piki-realtime-last-event:customer";
  const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const run = async () => {
    while (!controller.signal.aborted) {
      try {
        const lastId = sessionStorage.getItem(storageKey) || "";
        const response = await fetch("/api/v1/realtime/events", {
          signal: controller.signal,
          credentials: "include",
          headers: { "X-PIKI-Surface": "customer", ...(lastId ? { "Last-Event-ID": lastId } : {}) },
        });
        if (response.status === 401 || response.status === 403) {
          window.dispatchEvent(new Event("piki:realtime-auth-required"));
          return;
        }
        if (!response.ok || !response.body) throw new Error(`SSE_HTTP_${response.status}`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() || "";
          for (const frame of frames) {
            const lines = frame.split("\n");
            const eventId = lines.find((line) => line.startsWith("id: "))?.slice(4);
            const data = lines.find((line) => line.startsWith("data: "))?.slice(6);
            if (!data) continue;
            try {
              const event = JSON.parse(data) as CustomerRealtimeEvent;
              if (eventId) sessionStorage.setItem(storageKey, eventId);
              if (event.type) { window.dispatchEvent(new CustomEvent("piki:realtime", { detail: event })); onEvent(event); }
            } catch { /* ignore malformed frames and retain reconnect behavior */ }
          }
        }
      } catch { /* reconnection below */ }
      if (!controller.signal.aborted) await sleep(1_500);
    }
  };
  void run();
  return () => controller.abort();
}
