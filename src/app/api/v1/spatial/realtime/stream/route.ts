import { NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { realtimeEngine } from "../../realtime-shared";
import { RealtimeEventEnvelope } from "@/core/gis/realtime/spatial-event.model";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const { searchParams } = new URL(ctx.request.url);
  const channel = searchParams.get("channel") || `tenant:${tenantId}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const listener = (envelope: RealtimeEventEnvelope) => {
        const payload = `data: ${JSON.stringify(envelope)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        const unsubscribe = realtimeEngine.subscribeToChannel(
          { tenantId, userId: ctx.user.sub, role: ctx.user.role },
          channel,
          listener,
        );

        // Send connection handshake ping
        const ping = `event: connected\ndata: ${JSON.stringify({ channel, status: "subscribed", tenantId })}\n\n`;
        controller.enqueue(encoder.encode(ping));

        // Heartbeat interval
        const heartbeatTimer = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          } catch {
            clearInterval(heartbeatTimer);
            unsubscribe();
          }
        }, 15000);

        ctx.request.signal.addEventListener("abort", () => {
          clearInterval(heartbeatTimer);
          unsubscribe();
          controller.close();
        });
      } catch (err) {
        const errPayload = `event: error\ndata: ${JSON.stringify({ error: err instanceof Error ? err.message : "Subscription failed" })}\n\n`;
        controller.enqueue(encoder.encode(errPayload));
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  }) as NextResponse;
});
