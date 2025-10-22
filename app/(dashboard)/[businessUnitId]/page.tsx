import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { getDashboardData } from "@/lib/actions/dashboard-actions"
import { Skeleton } from "@/components/ui/skeleton"

interface BusinessUnitPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function BusinessUnitPage({ params }: BusinessUnitPageProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/sign-in")
  }

  const { businessUnitId } = await params

  return (
    <div className="flex-1 space-y-4">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent 
          businessUnitId={businessUnitId} 
          userRole={session.user.role}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  )
}

async function DashboardContent({ 
  businessUnitId, 
  userRole, 
  userId 
}: { 
  businessUnitId: string
  userRole: string
  userId: string
}) {
  const dashboardData = await getDashboardData(businessUnitId, userId)
  
  return (
    <DashboardClient 
      data={dashboardData} 
      businessUnitId={businessUnitId}
      userRole={userRole}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-[60px]" />
            <Skeleton className="h-3 w-[80px] mt-2" />
          </div>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <Skeleton className="h-[350px] w-full" />
        </div>
        <div className="col-span-3">
          <Skeleton className="h-[350px] w-full" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  )
}