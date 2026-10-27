import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="min-h-svh px-6 py-12">
      <article className="max-w-2xl mx-auto space-y-5 text-sm leading-relaxed text-muted-foreground [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:text-base [&_h2]:pt-3 [&_strong]:text-foreground [&_a]:underline [&_a]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
        <p className="text-xs">Last updated {updated}</p>
        {children}
      </article>
    </main>
  );
}

export const REPO_URL = 'https://github.com/Digvijay-Chavda/endpoint-ai';
