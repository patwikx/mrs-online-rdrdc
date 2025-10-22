import { notFound } from "next/navigation"
import { getMaterialRequestById } from "@/lib/actions/material-request-actions"
import { MaterialRequestDetailPage } from "@/components/material-requests/material-request-detail-page"

interface MaterialRequestDetailPageProps {
  params: Promise<{
    businessUnitId: string
    id: string
  }>
}

export default async function MaterialRequestDetail({
  params,
}: MaterialRequestDetailPageProps) {
  const { businessUnitId, id } = await params
  const materialRequest = await getMaterialRequestById(id)

  if (!materialRequest) {
    notFound()
  }

  // Ensure the material request belongs to the current business unit
  if (materialRequest.businessUnitId !== businessUnitId) {
    notFound()
  }

  return (
    <MaterialRequestDetailPage 
      materialRequest={materialRequest}
      businessUnitId={businessUnitId}
    />
  )
}