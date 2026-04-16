'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { appEvents } from '@/lib/events';
import { Zap, Folder, LayoutDashboard } from "lucide-react";
import { Project } from '@/types';
import {
  Sidebar,
  SidebarContent,
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



      <SidebarRail />
    </Sidebar>
  );
}
