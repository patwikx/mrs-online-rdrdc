import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { getMaterialRequestById } from "@/lib/actions/material-request-actions"
import { ApprovedRequestDetailPage } from "@/components/approvals/approved-request-detail-page"
import { RequestStatus } from "@prisma/client"

interface ApprovedRequestDetailPageProps {
  params: Promise<{
    businessUnitId: string
    id: string
  }>
}

export default async function ApprovedRequestDetail({
  params,
}: ApprovedRequestDetailPageProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/sign-in")
  }

  // Check if user can view approved requests
  if (!["ADMIN", "MANAGER", "PURCHASER", "STOCKROOM"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  const { businessUnitId, id } = await params
  const materialRequest = await getMaterialRequestById(id)

  if (!materialRequest) {
    notFound()
  }

  // Ensure this is an approved request (FINAL_APPROVED, POSTED, or RECEIVED)
  const approvedStatuses: RequestStatus[] = [RequestStatus.FINAL_APPROVED, RequestStatus.POSTED, RequestStatus.RECEIVED]
  if (!approvedStatuses.includes(materialRequest.status)) {
    notFound()
  }

  return (
    <ApprovedRequestDetailPage 
      materialRequest={materialRequest}
      businessUnitId={businessUnitId}
      userRole={session.user.role}
    />
  )
}