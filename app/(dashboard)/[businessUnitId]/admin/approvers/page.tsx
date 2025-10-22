import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDepartmentsWithApprovers, getEligibleUsers } from "@/lib/actions/approver-actions"
import { ApproversClient } from "@/components/admin/approvers-client"
import { Skeleton } from "@/components/ui/skeleton"

export default async function ApproversPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/sign-in")
  }

  // Check if user has admin privileges
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  return (
    <div className="flex-1 space-y-4">
      <Suspense fallback={<ApproversSkeleton />}>
        <ApproversContent />
      </Suspense>
    </div>
  )
}

async function ApproversContent() {
  const [departments, users] = await Promise.all([
    getDepartmentsWithApprovers(),
    getEligibleUsers(),
  ])
  
  return <ApproversClient initialDepartments={departments} users={users} />
}

function ApproversSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>

      {/* Department Cards */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-[250px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-[100px]" />
                <Skeleton className="h-6 w-[80px]" />
              </div>
            </div>
            
            {/* Table skeleton */}
            <div className="space-y-3">
              <div className="flex space-x-4">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[60px]" />
              </div>
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex space-x-4">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[60px]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}