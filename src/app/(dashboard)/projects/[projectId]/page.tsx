'use client';

import { useState, useEffect, use } from 'react';
import { Project, Endpoint } from '@/types';
import EndpointList from '@/components/EndpointList';
import EndpointForm from '@/components/EndpointForm';
import { RequestInspector } from '@/components/RequestInspector';
import { Button, buttonVariants } from "@/components/ui/button";
import { DeleteProjectDialog } from '@/components/DeleteProjectDialog';
import { EditProjectDialog } from '@/components/EditProjectDialog';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Folder, Plus, Activity, Layers, Trash2, Pencil, Download, Search, FolderX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'inspector'>('endpoints');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [search, setSearch] = useState('');

  const fetchProjectDetails = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.status === 404) {
        setNotFound(true);
      } else if (res.ok) {
        setNotFound(false);
        setProject(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEndpoints = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/endpoints?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setProject(null);
    setNotFound(false);
    setSearch('');
    fetchProjectDetails();
    fetchEndpoints();
    setEditingEndpoint(null);
  }, [projectId]);

  const visibleEndpoints = endpoints.filter(ep => {
    const q = search.trim().toLowerCase();
    return !q || ep.path.toLowerCase().includes(q) || ep.method.toLowerCase().includes(q);
  });

  const handleEditClick = (ep: Endpoint) => {
    setEditingEndpoint(ep);
    setIsDialogOpen(true);
  };

  const handleNewClick = () => {
    setEditingEndpoint(null);
    setIsDialogOpen(true);
  };

  const onFormComplete = () => {
    setIsDialogOpen(false);
    fetchEndpoints();
  };

  if (notFound) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full gap-3 text-center p-6">
        <FolderX className="w-12 h-12 text-muted-foreground opacity-50" />
        <h2 className="text-lg font-semibold">Project not found</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          It may have been deleted, or it belongs to a different browser session.
        </p>
        <Link href="/" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Back to home</Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-sm z-10 sticky top-0 px-4 sm:px-6 md:px-8 py-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Desktop sidebar trigger (hidden on mobile — mobile has the layout top bar) */}
          <SidebarTrigger className="hidden md:flex shrink-0 -ml-1 mr-1" />

          {/* Project info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight truncate">{project.name}</h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 shrink-0" /> Project
              </span>
              <span className="hidden xs:inline">•</span>
              <Badge variant="outline" className="font-mono text-xs bg-muted/50 truncate max-w-[200px]">
                /mock/{project.id}
              </Badge>
            </div>
            {project.description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              <button
                onClick={() => setActiveTab('endpoints')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'endpoints' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Endpoints</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1 h-4">{endpoints.length}</Badge>
              </button>
              <button
                onClick={() => setActiveTab('inspector')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'inspector' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Inspector</span>
                {activeTab === 'inspector' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />}
              </button>
            </div>

            {activeTab === 'endpoints' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger className={buttonVariants({ size: 'sm' })} onClick={handleNewClick}>
                  <Plus className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">New Endpoint</span>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingEndpoint ? 'Edit Mock Endpoint' : 'Create Mock Endpoint'}</DialogTitle>
                    <DialogDescription>
                      Configure your mock route, HTTP method, and desired latency/error behavior.
                    </DialogDescription>
                  </DialogHeader>
                  <EndpointForm
                    projectId={project.id}
                    onCreated={onFormComplete}
                    editingEndpoint={editingEndpoint}
                    onCancelEdit={() => setIsDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}

            <Button
              variant="outline"
              size="sm"
              title="Edit project"
              aria-label="Edit project"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <a
              href={`/api/projects/${project.id}/export`}
              download
              title="Export project as JSON"
              aria-label="Export project"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <Download className="w-4 h-4" />
            </a>
            <Button
              variant="outline"
              size="sm"
              title="Delete project"
              aria-label="Delete project"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <EditProjectDialog
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={setProject}
      />
      <DeleteProjectDialog
        project={deleteOpen ? { id: project.id, name: project.name } : null}
        onOpenChange={setDeleteOpen}
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-auto h-full">
        {activeTab === 'endpoints' ? (
          <div className="p-4 sm:p-6 md:p-8 bg-muted/10 h-full">
            <div className="max-w-5xl mx-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
              ) : (
                <>
                  {endpoints.length > 0 && (
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search endpoints by path or method"
                        aria-label="Search endpoints"
                        className="w-full h-9 rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  )}
                  {endpoints.length > 0 && visibleEndpoints.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No endpoints match “{search}”.</p>
                  )}
                {(endpoints.length === 0 || visibleEndpoints.length > 0) && (
                  <EndpointList
                    projectId={project.id}
                    endpoints={visibleEndpoints}
                    onRefresh={fetchEndpoints}
                    onEdit={handleEditClick}
                  />
                )}
                </>
              )}
            </div>
          </div>
        ) : (
          <RequestInspector projectId={project.id} />
        )}
      </div>
    </>
  );
}
