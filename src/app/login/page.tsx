import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Zap, Sparkles, Activity, Globe } from 'lucide-react';
import { auth } from '@/auth';
import { signInWithGoogle } from '@/app/actions';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Sign in — Endpoint' };

const ERRORS: Record<string, string> = {
  AccessDenied: 'Sign-in was not allowed. Use a Google account with a verified email.',
  Configuration: 'Sign-in is not configured correctly on this server.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (session?.user?.id) redirect('/');

  const { error } = await searchParams;
  const configured = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET && !!process.env.AUTH_SECRET;

  return (
    <main className="min-h-svh flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-5">
          <Zap className="w-7 h-7" />
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2">Endpoint</h1>
        <p className="text-lg font-semibold text-foreground/80 mb-2">AI-Powered API Mocking Platform</p>
        <p className="text-sm text-muted-foreground mb-8">
          Sign in to create your own mock APIs. Every account gets a private workspace and a ready-made sample API to explore.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8 text-xs text-muted-foreground">
          <div className="rounded-lg border bg-card p-3"><Sparkles className="w-4 h-4 mx-auto mb-1.5 text-violet-500" />AI payloads</div>
          <div className="rounded-lg border bg-card p-3"><Activity className="w-4 h-4 mx-auto mb-1.5 text-blue-500" />Live inspector</div>
          <div className="rounded-lg border bg-card p-3"><Globe className="w-4 h-4 mx-auto mb-1.5 text-emerald-500" />Instant URLs</div>
        </div>

        {(error || !configured) && (
          <p role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 mb-4">
            {!configured
              ? 'Google sign-in is not configured on this server (set AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET).'
              : ERRORS[error!] ?? 'Sign-in failed. Please try again.'}
          </p>
        )}

        <form action={signInWithGoogle}>
          <Button type="submit" size="lg" className="w-full gap-3" disabled={!configured}>
            <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
              <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7.5-5.8c-2.1 1.4-4.8 2.3-8 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Continue with Google
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-4">We only use your Google name, email and photo to identify your account.</p>
        <p className="text-xs text-muted-foreground mt-2">
          <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
          {' · '}
          <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
        </p>
      </div>
    </main>
  );
}
