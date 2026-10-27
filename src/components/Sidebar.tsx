'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { appEvents } from '@/lib/events';
import { Zap, Folder, LayoutDashboard, Trash2, Search, FileUp, LogOut } from "lucide-react";
import { signOutAction } from '@/app/actions';
import { Project } from '@/types';
import { DeleteProjectDialog } from '@/components/DeleteProjectDialog';
import { ImportProjectDialog } from '@/components/ImportProjectDialog';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function AppSidebar({ user }: { user: SidebarUser }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.status === 401) {
        window.location.assign('/login'); // session expired
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    fetchProjects();
    
    // Subscribe to global project created events
    const unsubscribeCreated = appEvents.subscribe('projectCreated', () => {
      fetchProjects();
    });
    const unsubscribeDeleted = appEvents.subscribe('projectDeleted', () => {
      fetchProjects();
    });
    const unsubscribeUpdated = appEvents.subscribe('projectUpdated', () => {
      fetchProjects();
    });

    return () => {
      unsubscribeCreated();
      unsubscribeDeleted();
      unsubscribeUpdated();
    };
  }, []);


  return (
    <Sidebar collapsible="offcanvas">
      {/* Logo & Brand */}
      <SidebarHeader className="border-b p-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none">
              Endpoint
            </h1>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Dashboard
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Project List */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Folder className="w-3.5 h-3.5" /> Your Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex items-center gap-1.5 px-2 pb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search projects"
                  aria-label="Search projects"
                  className="w-full h-8 rounded-md border bg-background pl-7 pr-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <button
                onClick={() => setImportOpen(true)}
                title="Import project (Endpoint, OpenAPI, Postman)"
                aria-label="Import project"
                className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md border hover:bg-muted transition-colors"
              >
                <FileUp className="w-4 h-4" />
              </button>
            </div>
            <SidebarMenu>
              {filteredProjects.map((proj) => {
                const isActive = pathname.startsWith(`/projects/${proj.id}`);
                return (
                  <SidebarMenuItem key={proj.id}>
                    <SidebarMenuButton isActive={isActive} render={<Link href={`/projects/${proj.id}`} />}>
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="truncate">{proj.name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      showOnHover
                      title="Delete project"
                      aria-label={`Delete project ${proj.name}`}
                      onClick={() => setProjectToDelete(proj)}
                    >
                      <Trash2 />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                );
              })}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground px-2 py-4">
                  No projects yet. Create one on the home page or import one.
                </p>
              )}
              {projects.length > 0 && filteredProjects.length === 0 && (
                <p className="text-sm text-muted-foreground px-2 py-4">No projects match “{query}”.</p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>



      <ImportProjectDialog open={importOpen} onOpenChange={setImportOpen} />
      <DeleteProjectDialog
        project={projectToDelete}
        onOpenChange={(open) => { if (!open) setProjectToDelete(null); }}
      />

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-2.5">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted shrink-0 flex items-center justify-center text-xs font-semibold">
              {(user.name || user.email || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.name || 'Signed in'}</p>
            {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
