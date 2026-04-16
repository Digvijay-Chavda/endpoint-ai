'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { appEvents } from '@/lib/events';
import { useCreateProject } from '@/hooks/use-create-project';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Folder, Plus, LayoutDashboard } from "lucide-react";
import { Project } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const [projects, setProjects] = useState<Project[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProjects();
    
    // Subscribe to global project created events
    const unsubscribe = appEvents.subscribe('projectCreated', () => {
      fetchProjects();
    });
    
    return () => unsubscribe();
  }, []);

  const {
    newProjectName,
    setNewProjectName,
    creatingProject,
    handleCreateProject,
  } = useCreateProject(() => {
    fetchProjects();
  });

  return (
    <Sidebar collapsible="offcanvas">
      {/* Logo & Brand */}
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none">
              RESTless
            </h1>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Dashboard
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Project List */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Folder className="w-3.5 h-3.5" /> Your Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.map((proj) => {
                const isActive = pathname.startsWith(`/projects/${proj.id}`);
                return (
                  <SidebarMenuItem key={proj.id}>
                    <SidebarMenuButton isActive={isActive} render={<Link href={`/projects/${proj.id}`} />}>
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="truncate">{proj.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground px-2 py-4">
                  No projects yet. Create one below.
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Create Project */}
      <SidebarFooter className="border-t p-4">
        <form onSubmit={handleCreateProject} className="flex gap-2">
          <Input
            placeholder="New project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="h-8 text-sm bg-background"
          />
          <Button
            type="submit"
            size="sm"
            disabled={creatingProject || !newProjectName.trim()}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </form>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
