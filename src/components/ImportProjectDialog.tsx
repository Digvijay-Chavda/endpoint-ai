'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileUp } from 'lucide-react';
import { appEvents } from '@/lib/events';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ImportProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function ImportProjectDialog({ open, onOpenChange }: ImportProjectDialogProps) {
  const [content, setContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleOpenChange = (next: boolean) => {
    if (importing) return;
    if (!next) {
      setContent('');
      setErrorMsg('');
    }
    onOpenChange(next);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg('That file is too large (5 MB max).');
      return;
    }
    setErrorMsg('');
    setContent(await file.text());
  };

  const handleImport = async () => {
    setImporting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/projects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Import failed');
      appEvents.emit('projectCreated');
      handleOpenChange(false);
      router.push(`/projects/${data.id}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import a project</DialogTitle>
          <DialogDescription>
            Upload or paste an Endpoint export, an OpenAPI / Swagger JSON file, or a Postman collection (v2.x).
            A new project is created with one endpoint per operation.
          </DialogDescription>
        </DialogHeader>
        {errorMsg && (
          <div role="alert" className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={e => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <Button type="button" variant="outline" className="gap-2 self-start" onClick={() => fileRef.current?.click()}>
          <FileUp className="w-4 h-4" /> Choose JSON file
        </Button>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="…or paste JSON here"
          rows={8}
          className="font-mono text-xs"
          spellCheck={false}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={importing}>Cancel</Button>
          <Button onClick={handleImport} disabled={importing || !content.trim()}>
            {importing ? 'Importing…' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
