'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appEvents } from '@/lib/events';

export function useCreateProject(onSuccess?: () => void) {
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState('');
  const router = useRouter();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    setCreatingProject(true);
    setCreateError('');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName }),
      });
      
      if (res.ok) {
        const newProj = await res.json();
        setNewProjectName('');
        
        // Call success callback if provided (e.g., to refetch projects in sidebar)
        if (onSuccess) {
          onSuccess();
        }

        // Notify global listeners that a project was created
        appEvents.emit('projectCreated');
        
        // Navigate to the new project
        router.push(`/projects/${newProj.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.error || 'Failed to create project');
      }
    } catch (e) {
      console.error(e);
      setCreateError('Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  return {
    newProjectName,
    setNewProjectName,
    creatingProject,
    createError,
    handleCreateProject,
  };
}
