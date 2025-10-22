import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getApprovedRequests } from "@/lib/actions/material-request-actions"
import { ApprovedRequestsClient } from "@/components/approvals/approved-requests-client"
import { Skeleton } from "@/components/ui/skeleton"

interface ApprovedRequestsPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function ApprovedRequestsPage({ params }: ApprovedRequestsPageProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/sign-in")
  }

  // Check if user can view approved requests
  if (!["ADMIN", "MANAGER", "PURCHASER", "STOCKROOM"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  const { businessUnitId } = await params

  return (
    <div className="flex-1 space-y-4">
      <Suspense fallback={<ApprovedRequestsSkeleton />}>
        <ApprovedRequestsContent userRole={session.user.role} businessUnitId={businessUnitId} />
      </Suspense>
    </div>
  )
}

async function ApprovedRequestsContent({ userRole, businessUnitId }: { userRole: string; businessUnitId: string }) {
  const requests = await getApprovedRequests()
  
  return <ApprovedRequestsClient initialRequests={requests} userRole={userRole} businessUnitId={businessUnitId} />
}

function ApprovedRequestsSkeleton() {
  return (
    <div className="flex-1 space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-[200px]" />
      </div>

      {/* Results count */}
      <Skeleton className="h-4 w-[200px]" />

      {/* Desktop Table */}
      <div className="rounded-md border hidden sm:block">
        <div className="p-0">
          {/* Table header */}
          <div className="border-b bg-muted/50 px-4 py-3">
            <div className="grid grid-cols-9 gap-4">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[70px]" />
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[140px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[70px]" />
            </div>
          </div>
          
          {/* Table rows */}
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <div className="grid grid-cols-9 gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-[80px]" />
                      <Skeleton className="h-3 w-[60px]" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-[80px] rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-3 w-[140px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[120px]" />
                  </div>
                  <Skeleton className="h-4 w-[90px]" />
                  <Skeleton className="h-4 w-[90px]" />
                  <Skeleton className="h-4 w-[90px]" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[70px]" />
                    <Skeleton className="h-3 w-[50px]" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
              </div>
              <Skeleton className="h-6 w-[100px] rounded-full" />
            </div>
            
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-3 w-[90px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              ))}
            </div>
            
            <div className="bg-muted/30 rounded-md p-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-6 w-[80px]" />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}