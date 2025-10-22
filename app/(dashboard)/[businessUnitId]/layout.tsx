import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import type { BusinessUnitItem } from '@/types/business-unit-types';
import { prisma } from '@/lib/prisma';
import { BusinessUnitProvider } from '@/context/business-unit-context';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { DynamicBreadcrumbs } from '@/components/dashboard/dynamic-breadcrumbs';
import { Toaster } from 'sonner';

export const metadata = {
  title: "Dashboard | Material Request System",
  description: "Material Request System for Business Units",
};

export default async function BusinessUnitLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessUnitId: string }>;
}) {
  const { businessUnitId } = await params;
  const session = await auth();

  // Redirect to sign-in if there's no session or user
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Check if user has admin access (simplified for now)
  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'OWNER';

  let businessUnits: BusinessUnitItem[] = [];

  // Get all business units (for now, we'll show all to admin users)
  if (isAdmin) {
    businessUnits = await prisma.businessUnit.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  } else {
    // For non-admin users, show all business units (you can restrict this later)
    businessUnits = await prisma.businessUnit.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  }

  // Verify the business unit exists
  const currentBusinessUnit = businessUnits.find(bu => bu.id === businessUnitId);
  if (!currentBusinessUnit) {
    const firstBusinessUnit = businessUnits[0];
    redirect(firstBusinessUnit ? `/${firstBusinessUnit.id}` : "/select-unit");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* App Sidebar */}
        <AppSidebar 
          session={session} 
          businessUnits={businessUnits}
          currentBusinessUnitId={businessUnitId}
        />
        
        {/* Main Content Area */}
        <SidebarInset className="flex-1">
          {/* Header with breadcrumb */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <DynamicBreadcrumbs businessUnitName={currentBusinessUnit?.name} />
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4">
            <BusinessUnitProvider businessUnitId={businessUnitId}>
              {children}
            </BusinessUnitProvider>
          </main>
        </SidebarInset>
      </div>
      
      {/* Toast Notifications */}
      <Toaster />
    </SidebarProvider>
  )
}