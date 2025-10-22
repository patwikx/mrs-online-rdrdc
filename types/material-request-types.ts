import { RequestStatus, RequestType, ApprovalStatus } from "@prisma/client"

export interface MaterialRequestItem {
  id: string
  itemCode: string | null
  description: string
  uom: string
  quantity: number
  unitPrice: number | null
  totalPrice: number | null
  remarks: string | null
  materialRequestId: string
  createdAt: Date
  updatedAt: Date
}

export interface MaterialRequest {
  id: string
  docNo: string
  series: string
  type: RequestType
  status: RequestStatus
  datePrepared: Date
  dateRequired: Date
  dateReceived: Date | null
  dateApproved: Date | null
  datePosted: Date | null
  dateRevised: Date | null
  businessUnitId: string
  departmentId: string | null
  chargeTo: string | null
  purpose: string | null
  remarks: string | null
  deliverTo: string | null
  freight: number
  discount: number
  total: number
  confirmationNo: string | null
  requestedById: string
  recApproverId: string | null
  recApprovalDate: Date | null
  recApprovalStatus: ApprovalStatus | null
  finalApproverId: string | null
  finalApprovalDate: Date | null
  finalApprovalStatus: ApprovalStatus | null
  createdAt: Date
  updatedAt: Date
  
  // Relations
  items: MaterialRequestItem[]
  businessUnit: {
    id: string
    name: string
    code: string
  }
  department: {
    id: string
    name: string
    code: string
  } | null
  requestedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  recApprover: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  finalApprover: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

export interface MaterialRequestFilters {
  status?: RequestStatus
  businessUnitId?: string
  departmentId?: string
  requestedById?: string
  type?: RequestType
  search?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface MaterialRequestFormData {
  type: RequestType
  datePrepared: Date
  dateRequired: Date
  businessUnitId: string
  departmentId?: string
  chargeTo?: string
  purpose?: string
  remarks?: string
  deliverTo?: string
  freight: number
  discount: number
  items: MaterialRequestItem[]
}

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  DRAFT: "Draft",
  FOR_REC_APPROVAL: "For Recommending Approval",
  REC_APPROVED: "Recommending Approved",
  FOR_FINAL_APPROVAL: "For Final Approval",
  FINAL_APPROVED: "Final Approved",
  FOR_POSTING: "For Posting",
  POSTED: "Posted",
  RECEIVED: "Done",
  TRANSMITTED: "Transmitted",
  CANCELLED: "Cancelled",
  DISAPPROVED: "Disapproved",
  FOR_EDIT: "For Edit",
}

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  ITEM: "Item",
  SERVICE: "Service",
}

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  DISAPPROVED: "Disapproved",
}

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  FOR_REC_APPROVAL: "bg-yellow-100 text-yellow-800",
  REC_APPROVED: "bg-blue-100 text-blue-800",
  FOR_FINAL_APPROVAL: "bg-orange-100 text-orange-800",
  FINAL_APPROVED: "bg-green-100 text-green-800",
  FOR_POSTING: "bg-purple-100 text-purple-800",
  POSTED: "bg-indigo-100 text-indigo-800",
  RECEIVED: "bg-teal-100 text-teal-800",
  TRANSMITTED: "bg-cyan-100 text-cyan-800",
  CANCELLED: "bg-red-100 text-red-800",
  DISAPPROVED: "bg-red-100 text-red-800",
  FOR_EDIT: "bg-amber-100 text-amber-800",
}