'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { appEvents } from '@/lib/events';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteProjectDialogProps {
  project: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({ project, onOpenChange }: DeleteProjectDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const handleOpenChange = (open: boolean) => {
    if (deleting) return;
    if (!open) setErrorMsg('');
    onOpenChange(open);
  };

  const handleDelete = async () => {
    if (!project) return;
    setDeleting(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete project');
      }
      appEvents.emit('projectDeleted');
      onOpenChange(false);
      if (pathname.startsWith(`/projects/${project.id}`)) router.push('/');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={!!project} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete project?</DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">{project?.name}</span> and all of its endpoints will be
            permanently deleted. Its mock URLs will stop working. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {errorMsg && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
