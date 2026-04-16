'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { HttpMethod, Endpoint } from '@/types';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AIGenerateModal } from "@/components/AIGenerateModal";

export default function EndpointForm({
  projectId,
  onCreated,
  editingEndpoint,
  onCancelEdit
}: {
  projectId: string;
  onCreated: () => void;
  editingEndpoint?: Endpoint | null;
  onCancelEdit?: () => void;
}) {
  const [path, setPath] = useState('/api/test');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [responseBody, setResponseBody] = useState('{\n  "status": "success",\n  "message": "Hello from Endpoint!"\n}');
  const [latencyMs, setLatencyMs] = useState(0);
  const [errorRate, setErrorRate] = useState(0);
  const [requireAuth, setRequireAuth] = useState(false);
  const [customAuthHeader, setCustomAuthHeader] = useState('');
  const [enableCors, setEnableCors] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [aiModalOpen, setAiModalOpen] = useState(false);

  useEffect(() => {
    if (editingEndpoint) {
      setPath(editingEndpoint.path);
      setMethod(editingEndpoint.method);
      setResponseBody(editingEndpoint.responseBody);
      setLatencyMs(editingEndpoint.latencyMs);
      setErrorRate(editingEndpoint.errorRate * 100);
      setRequireAuth(editingEndpoint.requireAuth || false);
      setCustomAuthHeader(editingEndpoint.customAuthHeader || '');
      setEnableCors(editingEndpoint.enableCors ?? true);
    } else {
      setPath('/api/test');
      setMethod('GET');
      setResponseBody('{\n  "status": "success",\n  "message": "Hello from Endpoint!"\n}');
      setLatencyMs(0);
      setErrorRate(0);
      setRequireAuth(false);
      setCustomAuthHeader('');
      setEnableCors(true);
    }
  }, [editingEndpoint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setErrorMsg("Please select or create a project first.");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const url = editingEndpoint ? `/api/endpoints/${editingEndpoint.id}` : '/api/endpoints';
      const reqMethod = editingEndpoint ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method: reqMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          path,
          method,
          responseBody,
          latencyMs,
          errorRate: errorRate / 100, // convert percentage to 0-1
          requireAuth,
          customAuthHeader,
          enableCors,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save endpoint');
      }

      setPath('/api/test');
      setResponseBody('{\n  "status": "success",\n  "message": "Hello from Endpoint!"\n}');
      setLatencyMs(0);
      setErrorRate(0);
      setRequireAuth(false);
      setCustomAuthHeader('');
      setEnableCors(true);
      onCreated();
      if (onCancelEdit) onCancelEdit();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const methodColors: Record<string, string> = {
    GET: 'text-emerald-500 dark:text-emerald-400 font-semibold',
    POST: 'text-blue-500 dark:text-blue-400 font-semibold',
    PUT: 'text-amber-500 dark:text-amber-400 font-semibold',
    PATCH: 'text-amber-500 dark:text-amber-400 font-semibold',
    DELETE: 'text-rose-500 dark:text-rose-400 font-semibold',
  };

  return (
    <form id="endpointForm" onSubmit={handleSubmit} className="flex flex-col gap-6 py-4 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {errorMsg && (
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md text-sm animate-in fade-in zoom-in-95 duration-300">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      <div className="flex gap-4">
        <div className="w-1/3 space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Method</Label>
          <Select value={method} onValueChange={(v) => { if (v) setMethod(v as HttpMethod) }}>
            <SelectTrigger className={`font-mono ${methodColors[method]}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                <SelectItem key={m} value={m} className={`font-mono ${methodColors[m]}`}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Path</Label>
          <Input
            value={path}
            onChange={e => setPath(e.target.value)}
            placeholder="/api/users"
            className="font-mono text-sm bg-card"
          />
        </div>
      </div>

      {/* AI Context Window button */}
      <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group">
        <Sparkles className="w-4 h-4 text-primary shrink-0 group-hover:animate-pulse" />
        <div className="flex-1">
          <p className="text-sm font-medium text-primary leading-tight">Generate with AI</p>
          <p className="text-[11px] text-muted-foreground">Let Gemini write the JSON payload for you</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
          onClick={() => setAiModalOpen(true)}
        >
          <Sparkles className="w-3.5 h-3.5" /> Open AI
        </Button>
      </div>

      <div className="space-y-2 group">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-colors group-focus-within:text-foreground">JSON Response Body</Label>
        <Textarea
          value={responseBody}
          onChange={e => setResponseBody(e.target.value)}
          className="font-mono text-sm min-h-[200px] resize-y bg-card border-muted-foreground/20 leading-relaxed shadow-inner transition-colors focus-visible:border-primary/50"
          placeholder="{}"
        />
        <p className="text-[11px] text-muted-foreground font-mono">
          Tip: Use Faker.js templates like <code>{`{{faker.string.uuid()}}`}</code> or <code>{`{{faker.person.fullName()}}`}</code> for live random data.
        </p>
      </div>

      <div className="flex gap-4 p-4 rounded-xl border bg-muted/20">
        <div className="flex-1 space-y-2">
          <Label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Latency (ms)
          </Label>
          <Input
            type="number"
            min="0"
            max="10000"
            value={latencyMs}
            onChange={e => setLatencyMs(Number(e.target.value))}
            className="font-mono text-sm bg-card"
          />
        </div>

        <div className="flex-1 space-y-2">
          <Label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" />
            Error Rate (%)
          </Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={errorRate}
            onChange={e => setErrorRate(Number(e.target.value))}
            className="font-mono text-sm bg-card"
          />
        </div>
      </div>

      <div className="border-t pt-6 space-y-5">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">Advanced Simulation</h4>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable CORS Wildcards</Label>
            <p className="text-xs text-muted-foreground">Automatically sends Access-Control-Allow headers.</p>
          </div>
          <Switch checked={enableCors} onCheckedChange={setEnableCors} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Authentication</Label>
            <p className="text-xs text-muted-foreground">Mock endpoint will return 401 if unauthorized.</p>
          </div>
          <Switch checked={requireAuth} onCheckedChange={setRequireAuth} />
        </div>

        {requireAuth && (
          <div className="pt-2">
            <Label>Expected Authorization Header</Label>
            <Input
              placeholder="Bearer custom_token_123"
              value={customAuthHeader}
              onChange={e => setCustomAuthHeader(e.target.value)}
              className="mt-1 font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Leave empty to accept any non-empty authorization header.</p>
          </div>
        )}
      </div>

      <div className="pt-4 flex justify-end gap-2">

        {editingEndpoint && onCancelEdit && (
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading || !projectId}
        >
          {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> {editingEndpoint ? 'Update Endpoint' : 'Create Endpoint'}</>}
        </Button>
      </div>

      {/* AI Context Window Modal (portal-style, rendered outside the form flow) */}
      <AIGenerateModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onApply={(json) => setResponseBody(json)}
      />
    </form>
  );
}
