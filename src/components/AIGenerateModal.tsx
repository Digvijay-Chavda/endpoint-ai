'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Wand2, X, ArrowRight, Copy, Check, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const EXAMPLES = [
  {
    label: '🛒 E-commerce Products',
    prompt: '10 e-commerce products with id, title, price, imageUrl, category, rating, and stockCount',
  },
  {
    label: '👤 User List',
    prompt: 'A paginated user list API response with total, page, perPage, and an items array containing users with id, name, email, avatar, role, and createdAt',
  },
  {
    label: '💳 Payment Webhook',
    prompt: 'A payment webhook payload with orderId, status, amount, currency, customer object (name, email), and lineItems array',
  },
  {
    label: '📝 Blog Posts',
    prompt: '5 blog posts with id, title, slug, excerpt, coverImage, author (name + avatar), tags array, publishedAt, and readTimeMinutes',
  },
  {
    label: '🔔 Notifications',
    prompt: '8 notifications with id, type (info|warning|error|success), title, body, read boolean, createdAt, and a link',
  },
  {
    label: '🌍 REST Countries',
    prompt: '5 countries with name, code, capital, population, currency, flag emoji, and languages array',
  },
  {
    label: '🌍 Climate Data',
    prompt: '5 climate change indicators with region, co2Emissions, temperatureAnomaly, seaLevelRise, and recordedAt',
  },
  {
    label: '🏥 Healthcare APIs',
    prompt: 'A paginated list of medical facilities with id, name, type (hospital|clinic), capacity, availableBeds, and emergencyContact',
  },
  {
    label: '💰 Financial Aid',
    prompt: 'A micro-loan webhook payload with applicantId, amount, status, impactCategory (education|agriculture), and disbursementDate',
  },
  {
    label: '🌾 Agriculture Yield',
    prompt: '5 crop yield records with farmId, cropType, expectedYieldKg, soilMoistureLevel, and recommendedFertilizer',
  },
  {
    label: '🚨 Disaster Relief',
    prompt: '8 active disaster relief operations with incidentId, severity, affectedCount, requiredResources array, and status',
  },
  {
    label: '📚 Edu Tech',
    prompt: 'A paginated curriculum response with courseId, subject, targetAge, modules array, and accessibilityFeatures',
  },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

interface AIGenerateModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (json: string) => void;
}

export function AIGenerateModal({ open, onClose, onApply }: AIGenerateModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed');

      const pretty = JSON.stringify(JSON.parse(data.result), null, 2);
      setMessages(prev => [...prev, { role: 'assistant', content: pretty }]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'AI generation failed';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApply = (content: string) => {
    try {
      const pretty = JSON.stringify(JSON.parse(content), null, 2);
      onApply(pretty);
      onClose();
    } catch {
      onApply(content);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — slides in from the right */}
      <div className="relative ml-auto h-full w-full max-w-xl flex flex-col bg-background border-l shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b bg-linear-to-r from-primary/10 via-background to-background">
          <div className="bg-primary/15 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">AI Payload Generator</h2>
            <p className="text-xs text-muted-foreground">Powered by Gemini 2.0 Flash · responses are cached</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Empty state — show examples */
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Describe the API response you need and Gemini will generate a realistic JSON payload for you. Try one of these:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {EXAMPLES.map(ex => (
                  <button
                    key={ex.label}
                    onClick={() => sendMessage(ex.prompt)}
                    className="group flex items-start gap-3 text-left p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all text-sm"
                  >
                    <span className="font-medium flex-1">{ex.label}</span>
                    <ArrowRight className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat messages */
            <div className="p-5 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  {msg.role === 'user' ? (
                    <div className="max-w-[85%] bg-primary text-primary-foreground px-3.5 py-2.5 rounded-2xl rounded-tr-none text-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="w-full space-y-2">
                      {msg.error ? (
                        <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl border border-destructive/20">
                          {msg.content}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Zap className="w-3 h-3 text-primary" /> Gemini
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-6 text-xs px-2 gap-1" onClick={() => handleCopy(msg.content)}>
                                {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                              </Button>
                              <Button size="sm" className="h-6 text-xs px-2 gap-1" onClick={() => handleApply(msg.content)}>
                                Use this <ArrowRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <pre className="bg-muted/60 border rounded-xl p-3 font-mono text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                            {msg.content}
                          </pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                  Generating…
                </div>
              )}
            </div>
          )}
        </div>

        {/* Examples shortcut after first message */}
        {messages.length > 0 && (
          <div className="px-5 pt-2 flex gap-2 flex-wrap">
            {EXAMPLES.slice(0, 3).map(ex => (
              <button
                key={ex.label}
                onClick={() => sendMessage(ex.prompt)}
                className="text-[11px] px-2 py-1 rounded-full border bg-muted/30 hover:bg-muted/70 transition-colors text-muted-foreground hover:text-foreground"
              >
                {ex.label}
              </button>
            ))}
            <button
              onClick={() => setMessages([])}
              className="text-[11px] px-2 py-1 rounded-full border bg-muted/30 hover:bg-muted/70 transition-colors text-muted-foreground flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" /> New chat
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className="shrink-0 p-4 border-t bg-background/95 backdrop-blur-sm">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              placeholder="Describe your API response... (Enter to send)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={2}
              className="resize-none text-sm"
              disabled={loading}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              size="sm"
              className="shrink-0 self-end gap-1.5 h-9"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {loading ? '…' : 'Generate'}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Shift+Enter for new line · Responses cached by prompt hash</p>
        </div>
      </div>
    </div>
  );
}
