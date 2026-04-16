import { subscribe } from '@/lib/inspector-bus';

export const dynamic = 'force-dynamic';

// GET /api/inspector/[projectId]  → Server-Sent Events stream
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send an initial "connected" heartbeat so the client knows it's alive
      const heartbeat = `data: ${JSON.stringify({ type: 'connected', projectId })}\n\n`;
      controller.enqueue(encoder.encode(heartbeat));

      // Subscribe to the bus; every published entry fires this callback
      const unsubscribe = subscribe(projectId, (entry) => {
        const payload = `data: ${JSON.stringify({ type: 'log', entry })}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream was closed
        }
      });

      // Heartbeat every 25 s to keep proxies from closing the connection
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 25_000);

      // Cleanup when the client disconnects
      const cleanup = () => {
        clearInterval(pingInterval);
        unsubscribe();
        try { controller.close(); } catch {}
      };

      // NOTE: ReadableStream cancel is called when the client closes the connection
      // We expose cleanup via a custom property used by cancel()
      (controller as any)._cleanup = cleanup;
    },
    cancel() {
      // @ts-ignore
      if (this._cleanup) this._cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
