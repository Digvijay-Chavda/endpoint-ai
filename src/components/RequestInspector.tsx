'use client';

import { useEffect, useRef, useState } from 'react';
import { InspectorLogEntry } from '@/lib/inspector-bus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Trash2, Pause, Play, ChevronDown, ChevronRight } from 'lucide-react';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  PATCH: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  DELETE: 'bg-red-500/15 text-red-400 border-red-500/30',
};

function statusColor(code: number) {
  if (code >= 500) return 'bg-red-500/15 text-red-400 border-red-500/30';
  if (code >= 400) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  if (code >= 200) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  return 'bg-muted text-muted-foreground border-border';
}

function LogRow({ entry }: { entry: InspectorLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(entry.timestamp).toLocaleTimeString();

  return (
    <div className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm"
        onClick={() => setExpanded(v => !v)}
      >
        {expanded ? <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />}
        <span className="text-muted-foreground font-mono text-xs w-20 shrink-0">{time}</span>
        <Badge className={`font-mono text-[10px] px-1.5 py-0 shrink-0 border ${METHOD_COLORS[entry.method] ?? 'bg-muted'}`}>
          {entry.method}
        </Badge>
        <Badge className={`font-mono text-[10px] px-1.5 py-0 shrink-0 border ${statusColor(entry.statusCode)}`}>
          {entry.statusCode}
        </Badge>
        <span className="font-mono text-xs flex-1 truncate">{entry.path}</span>
        <span className="text-xs text-muted-foreground shrink-0">{entry.latencyMs} ms</span>
      </button>

      {expanded && (
        <div className="px-12 pb-4 grid grid-cols-1 gap-4 text-xs">
          {Object.keys(entry.queryParams).length > 0 && (
            <section>
              <h5 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Query Params</h5>
              <pre className="bg-muted/50 rounded p-3 font-mono text-xs overflow-auto max-h-32">
                {JSON.stringify(entry.queryParams, null, 2)}
              </pre>
            </section>
          )}
          <section>
            <h5 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Request Headers</h5>
            <pre className="bg-muted/50 rounded p-3 font-mono text-xs overflow-auto max-h-32">
              {JSON.stringify(entry.requestHeaders, null, 2)}
            </pre>
          </section>
          {entry.requestBody && (
            <section>
              <h5 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Request Body</h5>
              <pre className="bg-muted/50 rounded p-3 font-mono text-xs overflow-auto max-h-40">
                {entry.requestBody}
              </pre>
            </section>
          )}
          {entry.responseBody && (
            <section>
              <h5 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Response Body</h5>
              <pre className="bg-emerald-950/30 border border-emerald-500/20 rounded p-3 font-mono text-xs overflow-auto max-h-40">
                {(() => {
                  try { return JSON.stringify(JSON.parse(entry.responseBody), null, 2); }
                  catch { return entry.responseBody; }
                })()}
              </pre>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export function RequestInspector({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<InspectorLogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/inspector/${projectId}`);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (event) => {
      if (pausedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'log') {
          setLogs(prev => [data.entry, ...prev].slice(0, 200)); // keep last 200
        }
      } catch { /* ignore parse errors */ }
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [projectId]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
        <span className="text-xs text-muted-foreground font-medium">
          {connected ? 'Live — listening for requests' : 'Disconnected'}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost" size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setPaused(v => !v)}
          >
            {paused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
          </Button>
          <Button
            variant="ghost" size="sm"
            className="h-7 text-xs gap-1.5 text-muted-foreground"
            onClick={() => setLogs([])}
          >
            <Trash2 className="w-3 h-3" /> Clear
          </Button>
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-auto">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Activity className="w-10 h-10 opacity-20" />
            <p className="text-sm">Waiting for requests…</p>
            <p className="text-xs">Hit your <code className="bg-muted px-1 rounded">/mock/{projectId}/...</code> URLs to see them appear here in real-time.</p>
          </div>
        ) : (
          <div className="divide-y">
            {logs.map(entry => <LogRow key={entry.id} entry={entry} />)}
          </div>
        )}
      </div>
    </div>
  );
}
