import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getBusinessUnits } from "@/lib/actions/business-unit-actions"
import { BusinessUnitsClient } from "@/components/admin/business-units-client"
import { Skeleton } from "@/components/ui/skeleton"

export default async function BusinessUnitsPage() {
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
      <Suspense fallback={<BusinessUnitsSkeleton />}>
        <BusinessUnitsContent />
      </Suspense>
    </div>
  )
}

async function BusinessUnitsContent() {
  const businessUnits = await getBusinessUnits()
  
  return <BusinessUnitsClient initialBusinessUnits={businessUnits} />
}

function BusinessUnitsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[180px]" />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-[200px]" />
          </div>
          
          {/* Table header */}
          <div className="flex space-x-4">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
          </div>
          
          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}