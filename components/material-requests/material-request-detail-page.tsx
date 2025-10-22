"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MaterialRequest } from "@/types/material-request-types"
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from "@/types/material-request-types"
import { MaterialRequestEditForm } from "./material-request-edit-form"
import { MaterialRequestViewContent } from "./material-request-view-content"

interface MaterialRequestDetailPageProps {
  materialRequest: MaterialRequest
  businessUnitId: string
}

export function MaterialRequestDetailPage({
  materialRequest,
  businessUnitId,
}: MaterialRequestDetailPageProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  const canEdit = materialRequest.status === "DRAFT" || materialRequest.status === "FOR_EDIT"

  const handleEditSuccess = () => {
    setIsEditing(false)
    router.refresh()
  }

  return (
    <div className="w-full max-w-none px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-bold">{materialRequest.docNo}</h1>
            <p className="text-muted-foreground">
              {materialRequest.type === "ITEM" ? "Item Request" : "Service Request"}
            </p>
          </div>
          <Badge 
            variant="secondary" 
            className={REQUEST_STATUS_COLORS[materialRequest.status]}
          >
            {REQUEST_STATUS_LABELS[materialRequest.status]}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          {isEditing ? (
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel Edit
            </Button>
          ) : (
            canEdit && (
              <Button
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Request
              </Button>
            )
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <MaterialRequestEditForm
          materialRequest={materialRequest}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <MaterialRequestViewContent materialRequest={materialRequest} />
      )}
    </div>
  )
}