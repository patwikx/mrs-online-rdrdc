import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDepartments } from "@/lib/actions/department-actions"
import { getBusinessUnits } from "@/lib/actions/business-unit-actions"
import { DepartmentsClient } from "@/components/admin/departments-client"
import { Skeleton } from "@/components/ui/skeleton"

export default async function DepartmentsPage() {
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
      <Suspense fallback={<DepartmentsSkeleton />}>
        <DepartmentsContent />
      </Suspense>
    </div>
  )
}

async function DepartmentsContent() {
  const [departments, businessUnits] = await Promise.all([
    getDepartments(),
    getBusinessUnits(),
  ])
  
  return <DepartmentsClient initialDepartments={departments} businessUnits={businessUnits} />
}

function DepartmentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
        <Skeleton className="h-10 w-[160px]" />
      </div>

      {/* Business Unit Cards */}
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-[250px]" />
            </div>
            
            {/* Table skeleton */}
            <div className="space-y-3">
              <div className="flex space-x-4">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex space-x-4">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}