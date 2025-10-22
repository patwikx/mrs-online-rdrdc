import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getMaterialRequestById } from "@/lib/actions/material-request-actions"
import { ReceivedRequestDetailPage } from "@/components/mrs-coordinator/received-request-detail-page"
import { Skeleton } from "@/components/ui/skeleton"

interface ReceivedRequestDetailProps {
  params: Promise<{
    businessUnitId: string
    id: string
  }>
}

export default async function ReceivedRequestDetail({ params }: ReceivedRequestDetailProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/sign-in")
  }

  // Check if user can view received requests
  if (!["ADMIN", "MANAGER", "PURCHASER", "STOCKROOM"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  const { businessUnitId, id } = await params

  return (
    <div className="flex-1 space-y-4">
      <Suspense fallback={<ReceivedRequestDetailSkeleton />}>
        <ReceivedRequestDetailContent 
          requestId={id} 
          userRole={session.user.role} 
          businessUnitId={businessUnitId} 
        />
      </Suspense>
    </div>
  )
}

async function ReceivedRequestDetailContent({ 
  requestId, 
  userRole, 
  businessUnitId 
}: { 
  requestId: string
  userRole: string
  businessUnitId: string 
}) {
  const request = await getMaterialRequestById(requestId)
  
  if (!request) {
    notFound()
  }

  // Ensure this is a received request
  if (request.status !== "RECEIVED") {
    redirect(`/${businessUnitId}/mrs-coordinator/received`)
  }
  
  return (
    <ReceivedRequestDetailPage 
      request={request} 
      userRole={userRole} 
      businessUnitId={businessUnitId} 
    />
  )
}

function ReceivedRequestDetailSkeleton() {
  return (
    <div className="flex-1 space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>

      {/* Request Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[150px] w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[150px] w-full" />
        </div>
      </div>

      {/* Items Table */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  )
}