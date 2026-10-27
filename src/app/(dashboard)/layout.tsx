import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppSidebar } from "@/components/Sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar user={{ name: session.user.name, email: session.user.email, image: session.user.image }} />
      <SidebarInset className="flex flex-col min-h-svh overflow-hidden">
        {/* Mobile-only top bar with sidebar trigger */}
        <div className="flex items-center h-12 px-4 border-b bg-background/95 backdrop-blur-sm md:hidden shrink-0">
          <SidebarTrigger />
          <span className="ml-3 text-sm font-semibold text-foreground">Endpoint</span>
        </div>
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
