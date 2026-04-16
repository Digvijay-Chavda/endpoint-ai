'use client';
import { Zap, ArrowRight, Sparkles, Globe, Shield, Activity, Clock, Code2, Heart, Leaf, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateProject } from '@/hooks/use-create-project';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Payload Generation',
    description: 'Describe any API response in plain English — Gemini 2.5 Flash generates realistic JSON instantly.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Activity,
    title: 'Network Simulation',
    description: 'Configure per-endpoint latency, error rates, auth enforcement, and CORS — test real-world edge cases.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Globe,
    title: 'Instant Live URLs',
    description: 'Every endpoint is live immediately at /mock/[projectId]/[path] — no backend needed.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Code2,
    title: 'Faker.js Templates',
    description: 'Use {{faker.person.fullName()}} syntax for fresh, randomised data on every request.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Shield,
    title: 'Auth & CORS Controls',
    description: 'Simulate protected endpoints with custom auth headers and CORS policies per endpoint.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Clock,
    title: 'Real-Time Inspector',
    description: 'Live SSE feed of every incoming request — see headers, params, and body as they arrive.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
];

const USE_CASES = [
  { icon: Heart, label: 'Healthcare APIs', color: 'text-rose-400' },
  { icon: Leaf, label: 'Climate Data', color: 'text-emerald-400' },
  { icon: Globe, label: 'Disaster Relief', color: 'text-blue-400' },
  { icon: Zap, label: 'FinTech Apps', color: 'text-amber-400' },
];

export default function LandingPage() {
  const {
    newProjectName,
    setNewProjectName,
    creatingProject,
    handleCreateProject,
  } = useCreateProject();

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative px-6 pt-16 pb-20 text-center overflow-hidden border-b">
        {/* Subtle gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Track badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/60 text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="w-3 h-3 text-violet-500" />
            Quantum Sprint Hackathon · Best AI Innovation &amp; SaaS
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">
            <span className="bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              RESTless
            </span>
          </h1>
          <p className="text-xl sm:text-2xl font-semibold text-foreground/80 mb-3">
            AI-Powered API Mocking Platform
          </p>
          <p className="text-base text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Stop waiting for backends. Instantly generate realistic mock APIs with AI-crafted payloads,
            network simulation, and live request inspection — built for developers creating apps for{' '}
            <span className="text-foreground font-semibold">social good</span>.
          </p>

          {/* Social good use cases */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {USE_CASES.map(({ icon: Icon, label, color }) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-muted/40 text-sm font-medium">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                {label}
              </span>
            ))}
          </div>

          {/* Create project CTA */}
          <div className="max-w-sm mx-auto">
            <p className="text-sm text-muted-foreground mb-3 font-medium">Start your first project:</p>
            <form onSubmit={handleCreateProject} className="flex gap-2">
              <Input
                placeholder='e.g. "Disaster Relief API"'
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="bg-background"
                disabled={creatingProject}
              />
              <Button
                type="submit"
                disabled={creatingProject || !newProjectName.trim()}
                className="shrink-0 gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {creatingProject ? 'Creating…' : 'Create'}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Or select an existing project from the sidebar ←
            </p>
          </div>
        </div>
      </section>

      {/* ── Mock URL showcase ────────────────────────────── */}
      <section className="px-6 py-12 border-b">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Your endpoints are live instantly at
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border bg-muted/40 font-mono text-sm overflow-x-auto">
            <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-muted-foreground">https://restless-five.vercel.app</span>
            <span className="text-foreground font-bold">/mock/[projectId]/[your-path]</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No server setup. No deployment. Just define your endpoint and share the URL.
          </p>
        </div>
      </section>

      {/* ── Features grid ───────────────────────────────── */}
      <section className="px-6 py-16 border-b">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-2">Everything you need</h2>
          <p className="text-muted-foreground text-center mb-10 text-sm">
            A complete API mocking toolkit powered by Google Gemini.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
              <div key={title} className="p-5 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all group">
                <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="px-6 py-16 border-b bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-2">How the mock engine works</h2>
          <p className="text-muted-foreground text-center mb-10 text-sm">
            Every request to your mock URL goes through a 7-step pipeline.
          </p>
          <div className="space-y-3">
            {[
              { step: '01', title: 'Route Match', desc: 'Looks up endpoint by projectId, method, and path' },
              { step: '02', title: 'Auth Gate', desc: 'Returns 401 if auth is required and header is missing or invalid' },
              { step: '03', title: 'CORS', desc: 'Appends wildcard CORS headers if enabled for this endpoint' },
              { step: '04', title: 'Latency', desc: 'Delays the response by the configured latencyMs value' },
              { step: '05', title: 'Error Simulation', desc: 'Randomly returns a 5xx error at the configured error rate' },
              { step: '06', title: 'Faker Processing', desc: 'Interpolates {{faker.*}} template tokens with fresh values' },
              { step: '07', title: 'Inspector + Response', desc: 'Emits to real-time SSE bus, then returns the JSON payload' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4 p-4 rounded-lg bg-card border">
                <span className="text-xs font-black text-muted-foreground/50 font-mono pt-0.5 shrink-0 w-6">{step}</span>
                <div>
                  <span className="font-semibold text-sm">{title}</span>
                  <span className="text-muted-foreground text-sm"> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack ──────────────────────────────────── */}
      <section className="px-6 py-12 border-b">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold tracking-tight mb-6">Built with modern tech</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              'Next.js 16', 'TypeScript', 'PostgreSQL', 'Prisma ORM',
              'Google Gemini 2.5 Flash', 'Faker.js', 'shadcn/ui',
              'Tailwind CSS v4', 'Server-Sent Events',
            ].map(tech => (
              <span key={tech} className="px-3 py-1.5 rounded-full border bg-muted/40 text-xs font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ──────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Ready to mock?</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Create a project, define your endpoints, and start building — no backend required.
          </p>
          <form onSubmit={handleCreateProject} className="flex gap-2 max-w-xs mx-auto">
            <Input
              placeholder="New project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="bg-background"
              disabled={creatingProject}
            />
            <Button type="submit" disabled={creatingProject || !newProjectName.trim()} className="gap-1.5 shrink-0">
              <ArrowRight className="w-4 h-4" />
              Go
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
