import { prisma } from '@/lib/prisma';
import { findAccessibleProject, notFound } from '@/lib/owner';
import { toLogEntry } from '@/lib/request-log';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const POLL_MS = 1000;
// Close before the platform's function limit; EventSource reconnects and resumes via Last-Event-ID.
const MAX_STREAM_MS = 55_000;

// GET /api/inspector/[projectId]?since=<ISO>  → Server-Sent Events stream
//
// Requests are stored in the database by the mock route, so this stream polls the table instead of
// relying on in-process memory. That keeps it working when requests are served by a different
// serverless instance than the one holding the stream.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  if (!(await findAccessibleProject(projectId))) return notFound();

  const url = new URL(req.url);
  const resumeFrom = req.headers.get('last-event-id') || url.searchParams.get('since');
  let cursor = resumeFrom && !Number.isNaN(Date.parse(resumeFrom)) ? new Date(resumeFrom) : new Date();
  const seen = new Set<string>();

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  let ping: ReturnType<typeof setInterval> | undefined;
  let stopAt: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (text: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          closed = true;
        }
      };
      const close = () => {
        closed = true;
        clearInterval(timer);
        clearInterval(ping);
        clearTimeout(stopAt);
        try { controller.close(); } catch { /* already closed */ }
      };

      send(`data: ${JSON.stringify({ type: 'connected', projectId })}\n\n`);

      let polling = false;
      timer = setInterval(async () => {
        if (closed || polling) return;
        polling = true;
        try {
          const rows = await prisma.requestLog.findMany({
            where: { projectId, createdAt: { gte: cursor } },
            orderBy: { createdAt: 'asc' },
            take: 100,
          });
          for (const row of rows) {
            if (seen.has(row.id)) continue;
            seen.add(row.id);
            cursor = row.createdAt;
            send(`id: ${row.createdAt.toISOString()}\ndata: ${JSON.stringify({ type: 'log', entry: toLogEntry(row) })}\n\n`);
          }
          if (seen.size > 500) {
            // Only ids at the current cursor timestamp can repeat; keep the set small.
            const keep = rows.filter(r => r.createdAt.getTime() === cursor.getTime()).map(r => r.id);
            seen.clear();
            keep.forEach(id => seen.add(id));
          }
        } catch (e) {
          console.error('[inspector] poll failed', e);
        } finally {
          polling = false;
        }
      }, POLL_MS);

      // Comment ping keeps proxies from closing an idle connection
      ping = setInterval(() => send(': ping\n\n'), 15_000);
      stopAt = setTimeout(close, MAX_STREAM_MS);
      req.signal.addEventListener('abort', close);
    },
    cancel() {
      closed = true;
      clearInterval(timer);
      clearInterval(ping);
      clearTimeout(stopAt);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
