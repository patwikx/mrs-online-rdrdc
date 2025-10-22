"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { RequestStatus, RequestType, ApprovalStatus, ApproverType } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/auth"
import { Decimal } from "@prisma/client/runtime/library"

// Validation schemas
const MaterialRequestItemSchema = z.object({
  itemCode: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  uom: z.string().min(1, "Unit of measurement is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().optional(),
  remarks: z.string().optional(),
  isNew: z.boolean().default(true),
}).refine((data) => {
  if (!data.isNew && !data.itemCode) {
    return false
  }
  return true
}, {
  message: "Item code is required for existing items",
  path: ["itemCode"]
})

const CreateMaterialRequestSchema = z.object({
  docNo: z.string().optional(), // Will be generated server-side
  series: z.enum(["PO", "JO"]),
  type: z.nativeEnum(RequestType),
  status: z.nativeEnum(RequestStatus).default(RequestStatus.DRAFT),
  datePrepared: z.date(),
  dateRequired: z.date(),
  businessUnitId: z.string().min(1, "Business unit is required"),
  departmentId: z.string().optional(),
  chargeTo: z.string().optional(),
  purpose: z.string().optional(),
  remarks: z.string().optional(),
  deliverTo: z.string().optional(),
  freight: z.number().default(0),
  discount: z.number().default(0),
  items: z.array(MaterialRequestItemSchema).min(1, "At least one item is required"),
})

const UpdateMaterialRequestSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(RequestType),
  datePrepared: z.date(),
  dateRequired: z.date(),
  businessUnitId: z.string().min(1, "Business unit is required"),
  departmentId: z.string().optional(),
  chargeTo: z.string().optional(),
  purpose: z.string().optional(),
  remarks: z.string().optional(),
  deliverTo: z.string().optional(),
  freight: z.number().default(0),
  discount: z.number().default(0),
  items: z.array(MaterialRequestItemSchema).min(1, "At least one item is required"),
})

const ApprovalSchema = z.object({
  requestId: z.string(),
  status: z.nativeEnum(ApprovalStatus),
  remarks: z.string().optional(),
})

export type CreateMaterialRequestInput = z.infer<typeof CreateMaterialRequestSchema>
export type UpdateMaterialRequestInput = z.infer<typeof UpdateMaterialRequestSchema>
export type ApprovalInput = z.infer<typeof ApprovalSchema>

export interface ActionResult {
  success: boolean
  message: string
  data?: {
    autoPosted?: boolean
    [key: string]: unknown
  }
}

// Generate document number
async function generateDocumentNumber(series: string): Promise<string> {
  const currentYear = new Date().getFullYear()
  const yearSuffix = currentYear.toString().slice(-2)
  
  // Get the latest document number for this series
  const latestRequest = await prisma.materialRequest.findFirst({
    where: {
      series: series,
      docNo: {
        contains: `-${yearSuffix}-`
      }
    },
    orderBy: {
      docNo: 'desc'
    }
  })

  let nextNumber = 1
  if (latestRequest) {
    const parts = latestRequest.docNo.split('-')
    if (parts.length >= 3) {
      const lastNumber = parseInt(parts[2])
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }
  }

  return `${series}-${yearSuffix}-${nextNumber.toString().padStart(5, '0')}`
}

export async function createMaterialRequest(input: CreateMaterialRequestInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const validatedData = CreateMaterialRequestSchema.parse(input)

    // Generate document number automatically
    const docNo = await generateDocumentNumber(validatedData.series)

    // Calculate total
    const total = validatedData.items.reduce((sum, item) => {
      const itemTotal = (item.unitPrice || 0) * item.quantity
      return sum + itemTotal
    }, 0) + validatedData.freight - validatedData.discount

    // Create the material request with items
    const materialRequest = await prisma.materialRequest.create({
      data: {
        docNo: docNo,
        series: validatedData.series,
        type: validatedData.type,
        status: validatedData.status,
        datePrepared: validatedData.datePrepared,
        dateRequired: validatedData.dateRequired,
        businessUnitId: validatedData.businessUnitId,
        departmentId: validatedData.departmentId || null,
        chargeTo: validatedData.chargeTo || null,
        purpose: validatedData.purpose || null,
        remarks: validatedData.remarks || null,
        deliverTo: validatedData.deliverTo || null,
        freight: new Decimal(validatedData.freight),
        discount: new Decimal(validatedData.discount),
        total: new Decimal(total),
        requestedById: session.user.id,
        items: {
          create: validatedData.items.map(item => ({
            itemCode: item.itemCode || null,
            description: item.description,
            uom: item.uom,
            quantity: new Decimal(item.quantity),
            unitPrice: item.unitPrice ? new Decimal(item.unitPrice) : null,
            totalPrice: item.unitPrice ? new Decimal(item.unitPrice * item.quantity) : null,
            remarks: item.remarks || null,
          }))
        }
      },
      include: {
        items: true,
        businessUnit: true,
        department: true,
        requestedBy: true,
      }
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedMaterialRequest = {
      ...materialRequest,
      freight: materialRequest.freight.toNumber(),
      discount: materialRequest.discount.toNumber(),
      total: materialRequest.total.toNumber(),
      items: materialRequest.items.map(item => ({
        ...item,
        quantity: item.quantity.toNumber(),
        unitPrice: item.unitPrice?.toNumber() || null,
        totalPrice: item.totalPrice?.toNumber() || null,
      }))
    }

    revalidatePath("/material-requests")
    
    return {
      success: true,
      message: "Material request created successfully",
      data: serializedMaterialRequest
    }
  } catch (error) {
    console.error("Error creating material request:", error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      const fieldPath = firstError.path.join('.')
      return {
        success: false,
        message: `Validation error in ${fieldPath}: ${firstError.message}`
      }
    }

    return {
      success: false,
      message: "Failed to create material request"
    }
  }
}

export async function updateMaterialRequest(input: UpdateMaterialRequestInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const validatedData = UpdateMaterialRequestSchema.parse(input)

    // Check if user can edit this request
    const existingRequest = await prisma.materialRequest.findUnique({
      where: { id: validatedData.id },
      include: { items: true }
    })

    if (!existingRequest) {
      return { success: false, message: "Material request not found" }
    }

    if (existingRequest.requestedById !== session.user.id && !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "You can only edit your own requests" }
    }

    if (existingRequest.status !== RequestStatus.DRAFT && existingRequest.status !== RequestStatus.FOR_EDIT) {
      return { success: false, message: "Cannot edit request in current status" }
    }

    // Calculate total
    const total = validatedData.items.reduce((sum, item) => {
      const itemTotal = (item.unitPrice || 0) * item.quantity
      return sum + itemTotal
    }, 0) + validatedData.freight - validatedData.discount

    // Update the material request
    const materialRequest = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.materialRequestItem.deleteMany({
        where: { materialRequestId: validatedData.id }
      })

      // Update request and create new items
      return await tx.materialRequest.update({
        where: { id: validatedData.id },
        data: {
          type: validatedData.type,
          datePrepared: validatedData.datePrepared,
          dateRequired: validatedData.dateRequired,
          businessUnitId: validatedData.businessUnitId,
          departmentId: validatedData.departmentId || null,
          chargeTo: validatedData.chargeTo || null,
          purpose: validatedData.purpose || null,
          remarks: validatedData.remarks || null,
          deliverTo: validatedData.deliverTo || null,
          freight: new Decimal(validatedData.freight),
          discount: new Decimal(validatedData.discount),
          total: new Decimal(total),
          status: RequestStatus.DRAFT, // Reset to draft when edited
          items: {
            create: validatedData.items.map(item => ({
              itemCode: item.itemCode || null,
              description: item.description,
              uom: item.uom,
              quantity: new Decimal(item.quantity),
              unitPrice: item.unitPrice ? new Decimal(item.unitPrice) : null,
              totalPrice: item.unitPrice ? new Decimal(item.unitPrice * item.quantity) : null,
              remarks: item.remarks || null,
            }))
          }
        },
        include: {
          items: true,
          businessUnit: true,
          department: true,
          requestedBy: true,
        }
      })
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedMaterialRequest = {
      ...materialRequest,
      freight: materialRequest.freight.toNumber(),
      discount: materialRequest.discount.toNumber(),
      total: materialRequest.total.toNumber(),
      items: materialRequest.items.map(item => ({
        ...item,
        quantity: item.quantity.toNumber(),
        unitPrice: item.unitPrice?.toNumber() || null,
        totalPrice: item.totalPrice?.toNumber() || null,
      }))
    }

    revalidatePath("/material-requests")
    
    return {
      success: true,
      message: "Material request updated successfully",
      data: serializedMaterialRequest
    }
  } catch (error) {
    console.error("Error updating material request:", error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.message || "Validation error"
      }
    }

    return {
      success: false,
      message: "Failed to update material request"
    }
  }
}

export async function deleteMaterialRequest(requestId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const existingRequest = await prisma.materialRequest.findUnique({
      where: { id: requestId }
    })

    if (!existingRequest) {
      return { success: false, message: "Material request not found" }
    }

    if (existingRequest.requestedById !== session.user.id && !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "You can only delete your own requests" }
    }

    if (existingRequest.status !== RequestStatus.DRAFT) {
      return { success: false, message: "Cannot delete request in current status" }
    }

    await prisma.materialRequest.delete({
      where: { id: requestId }
    })

    revalidatePath("/material-requests")
    
    return {
      success: true,
      message: "Material request deleted successfully"
    }
  } catch (error) {
    console.error("Error deleting material request:", error)
    
    return {
      success: false,
      message: "Failed to delete material request"
    }
  }
}

export async function submitForApproval(requestId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const existingRequest = await prisma.materialRequest.findUnique({
      where: { id: requestId },
      include: {
        department: {
          include: {
            approvers: {
              where: { 
                isActive: true,
                approverType: ApproverType.RECOMMENDING 
              },
              include: { user: true }
            }
          }
        }
      }
    })

    if (!existingRequest) {
      return { success: false, message: "Material request not found" }
    }

    if (existingRequest.requestedById !== session.user.id) {
      return { success: false, message: "You can only submit your own requests" }
    }

    if (existingRequest.status !== RequestStatus.DRAFT) {
      return { success: false, message: "Request is not in draft status" }
    }

    // Check if department has recommending approvers
    const recApprovers = existingRequest.department?.approvers || []
    if (recApprovers.length === 0) {
      return { success: false, message: "No recommending approvers found for this department" }
    }

    // Assign first available recommending approver
    const recApprover = recApprovers[0]

    await prisma.materialRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.FOR_REC_APPROVAL,
        recApproverId: recApprover.userId,
        recApprovalStatus: ApprovalStatus.PENDING,
      }
    })

    revalidatePath("/material-requests")
    
    return {
      success: true,
      message: "Material request submitted for approval successfully"
    }
  } catch (error) {
    console.error("Error submitting for approval:", error)
    
    return {
      success: false,
      message: "Failed to submit for approval"
    }
  }
}

export async function processRecommendingApproval(input: ApprovalInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const validatedData = ApprovalSchema.parse(input)

    const existingRequest = await prisma.materialRequest.findUnique({
      where: { id: validatedData.requestId },
      include: {
        department: {
          include: {
            approvers: {
              where: { 
                isActive: true,
                approverType: ApproverType.FINAL 
              },
              include: { user: true }
            }
          }
        }
      }
    })

    if (!existingRequest) {
      return { success: false, message: "Material request not found" }
    }

    if (existingRequest.recApproverId !== session.user.id) {
      return { success: false, message: "You are not authorized to approve this request" }
    }

    if (existingRequest.status !== RequestStatus.FOR_REC_APPROVAL) {
      return { success: false, message: "Request is not pending recommending approval" }
    }

    let updateData: Record<string, unknown> = {
      recApprovalStatus: validatedData.status,
      recApprovalDate: new Date(),
    }

    if (validatedData.status === ApprovalStatus.APPROVED) {
      // Check if department has final approvers
      const finalApprovers = existingRequest.department?.approvers || []
      if (finalApprovers.length === 0) {
        // No final approver needed, mark as final approved
        updateData = {
          ...updateData,
          status: RequestStatus.FINAL_APPROVED,
          finalApproverId: session.user.id,
          finalApprovalStatus: ApprovalStatus.APPROVED,
          finalApprovalDate: new Date(),
          dateApproved: new Date(),
        }
      } else {
        // Assign to final approver
        const finalApprover = finalApprovers[0]
        updateData = {
          ...updateData,
          status: RequestStatus.FOR_FINAL_APPROVAL,
          finalApproverId: finalApprover.userId,
          finalApprovalStatus: ApprovalStatus.PENDING,
        }
      }
    } else {
      // Disapproved
      updateData = {
        ...updateData,
        status: RequestStatus.DISAPPROVED,
      }
    }

    await prisma.materialRequest.update({
      where: { id: validatedData.requestId },
      data: updateData
    })

    revalidatePath("/material-requests")
    revalidatePath("/approvals")
    
    return {
      success: true,
      message: `Request ${validatedData.status.toLowerCase()} successfully`
    }
  } catch (error) {
    console.error("Error processing recommending approval:", error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.message || "Validation error"
      }
    }

    return {
      success: false,
      message: "Failed to process approval"
    }
  }
}

export async function processFinalApproval(input: ApprovalInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const validatedData = ApprovalSchema.parse(input)

    const existingRequest = await prisma.materialRequest.findUnique({
      where: { id: validatedData.requestId }
    })

    if (!existingRequest) {
      return { success: false, message: "Material request not found" }
    }

    if (existingRequest.finalApproverId !== session.user.id) {
      return { success: false, message: "You are not authorized to approve this request" }
    }

    if (existingRequest.status !== RequestStatus.FOR_FINAL_APPROVAL) {
      return { success: false, message: "Request is not pending final approval" }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updateData: Record<string, unknown> = {
      finalApprovalStatus: validatedData.status,
      finalApprovalDate: new Date(),
    }

    if (validatedData.status === ApprovalStatus.APPROVED) {
      // First update to FINAL_APPROVED
      await prisma.materialRequest.update({
        where: { id: validatedData.requestId },
        data: {
          finalApprovalStatus: validatedData.status,
          finalApprovalDate: new Date(),
          status: RequestStatus.FINAL_APPROVED,
          dateApproved: new Date(),
        }
      })

      // Then automatically update to POSTED
      await prisma.materialRequest.update({
        where: { id: validatedData.requestId },
        data: {
          status: RequestStatus.POSTED,
          datePosted: new Date(),
        }
      })
    } else {
      // If disapproved, just update the status
      await prisma.materialRequest.update({
        where: { id: validatedData.requestId },
        data: {
          finalApprovalStatus: validatedData.status,
          finalApprovalDate: new Date(),
          status: RequestStatus.DISAPPROVED,
        }
      })
    }

    revalidatePath("/material-requests")
    revalidatePath("/approvals")
    revalidatePath("/mrs-coordinator")
    
    return {
      success: true,
      message: validatedData.status === ApprovalStatus.APPROVED 
        ? "Request approved and automatically posted successfully" 
        : `Request ${validatedData.status.toLowerCase()} successfully`,
      data: { autoPosted: validatedData.status === ApprovalStatus.APPROVED }
    }
  } catch (error) {
    console.error("Error processing final approval:", error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.message || "Validation error"
      }
    }

    return {
      success: false,
      message: "Failed to process approval"
    }
  }
}

// Get functions
export async function getMaterialRequests(filters?: {
  status?: RequestStatus
  businessUnitId?: string
  departmentId?: string
  requestedById?: string
  type?: RequestType
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const where: Record<string, unknown> = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.businessUnitId) {
      where.businessUnitId = filters.businessUnitId
    }

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId
    }

    if (filters?.requestedById) {
      where.requestedById = filters.requestedById
    }

    if (filters?.type) {
      where.type = filters.type
    }

    const requests = await prisma.materialRequest.findMany({
      where,
      include: {
        items: true,
        businessUnit: true,
        department: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        recApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        finalApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedRequests = requests.map(request => ({
      ...request,
      freight: request.freight.toNumber(),
      discount: request.discount.toNumber(),
      total: request.total.toNumber(),
      items: request.items.map(item => ({
        ...item,
        quantity: item.quantity.toNumber(),
        unitPrice: item.unitPrice?.toNumber() || null,
        totalPrice: item.totalPrice?.toNumber() || null,
      }))
    }))

    return serializedRequests
  } catch (error) {
    console.error("Error fetching material requests:", error)
    return []
  }
}

export async function getMaterialRequestById(requestId: string) {
  try {
    const request = await prisma.materialRequest.findUnique({
      where: { id: requestId },
      include: {
        items: true,
        businessUnit: true,
        department: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        recApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        finalApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
      }
    })

    if (!request) return null

    // Convert Decimal fields to numbers for client serialization
    const serializedRequest = {
      ...request,
      freight: request.freight.toNumber(),
      discount: request.discount.toNumber(),
      total: request.total.toNumber(),
      items: request.items.map(item => ({
        ...item,
        quantity: item.quantity.toNumber(),
        unitPrice: item.unitPrice?.toNumber() || null,
        totalPrice: item.totalPrice?.toNumber() || null,
      }))
    }

    return serializedRequest
  } catch (error) {
    console.error("Error fetching material request:", error)
    return null
  }
}

export async function getNextDocumentNumber(series: string): Promise<string> {
  try {
    return await generateDocumentNumber(series)
  } catch (error) {
    console.error("Error generating document number:", error)
    const currentYear = new Date().getFullYear()
    const yearSuffix = currentYear.toString().slice(-2)
    return `${series}-${yearSuffix}-00001`
  }
}

export async function markAsPosted(requestId: string, confirmationNo?: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has permission to post (PURCHASER, ADMIN, MANAGER)
    if (!["ADMIN", "MANAGER", "PURCHASER"].includes(session.user.role)) {
      return { success: false, message: "You don't have permission to post material requests" }
    }

    const existingRequest = await prisma.materialRequest.findUnique({
      where: { id: requestId }
    })

    if (!existingRequest) {
      return { success: false, message: "Material request not found" }
    }

    if (existingRequest.status !== RequestStatus.FINAL_APPROVED) {
      return { success: false, message: "Request must be final approved before posting" }
    }

    await prisma.materialRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.POSTED,
        datePosted: new Date(),
        confirmationNo: confirmationNo || null,
      }
    })

    revalidatePath("/mrs-coordinator")
    
    return {
      success: true,
      message: "Material request marked as posted successfully"
    }
  } catch (error) {
    console.error("Error marking request as posted:", error)
    return {
      success: false,
      message: "Failed to mark request as posted"
    }
  }
}

export async function markAsReceived(requestId: string, supplierBPCode?: string, supplierName?: string, purchaseOrderNumber?: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has permission to receive (PURCHASER, STOCKROOM, ADMIN, MANAGER)
    if (!["ADMIN", "MANAGER", "PURCHASER", "STOCKROOM"].includes(session.user.role)) {
      return { success: false, message: "You don't have permission to receive material requests" }
    }

    const existingRequest = await prisma.materialRequest.findUnique({
      where: { id: requestId }
    })

    if (!existingRequest) {
      return { success: false, message: "Material request not found" }
    }

    if (existingRequest.status !== RequestStatus.POSTED) {
      return { success: false, message: "Request must be posted before marking as received" }
    }

    await prisma.materialRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.RECEIVED,
        dateReceived: new Date(),
        supplierBPCode: supplierBPCode || null,
        supplierName: supplierName || null,
        purchaseOrderNumber: purchaseOrderNumber || null,
      }
    })

    revalidatePath("/mrs-coordinator")
    
    return {
      success: true,
      message: "Material request marked as received successfully"
    }
  } catch (error) {
    console.error("Error marking request as received:", error)
    return {
      success: false,
      message: "Failed to mark request as received"
    }
  }
}

export async function getApprovedRequests(filters?: {
  status?: RequestStatus
  businessUnitId?: string
  search?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    // Check if user has permission to view approved requests
    if (!["ADMIN", "MANAGER", "PURCHASER", "STOCKROOM"].includes(session.user.role)) {
      return []
    }

    const where: Record<string, unknown> = {
      status: RequestStatus.FINAL_APPROVED // Only show final approved requests that haven't been posted yet
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.businessUnitId) {
      where.businessUnitId = filters.businessUnitId
    }

    if (filters?.search) {
      where.OR = [
        { docNo: { contains: filters.search, mode: 'insensitive' } },
        { purpose: { contains: filters.search, mode: 'insensitive' } },
        { requestedBy: { 
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } }
          ]
        }}
      ]
    }

    const requests = await prisma.materialRequest.findMany({
      where,
      include: {
        items: true,
        businessUnit: true,
        department: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        recApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        finalApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedRequests = requests.map(request => ({
      ...request,
      freight: request.freight.toNumber(),
      discount: request.discount.toNumber(),
      total: request.total.toNumber(),
      items: request.items.map(item => ({
        ...item,
        quantity: item.quantity.toNumber(),
        unitPrice: item.unitPrice?.toNumber() || null,
        totalPrice: item.totalPrice?.toNumber() || null,
      }))
    }))

    return serializedRequests
  } catch (error) {
    console.error("Error fetching approved requests:", error)
    return []
  }
}

export async function getPendingApprovalsForUser() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const requests = await prisma.materialRequest.findMany({
      where: {
        OR: [
          {
            recApproverId: session.user.id,
            status: RequestStatus.FOR_REC_APPROVAL,
            recApprovalStatus: ApprovalStatus.PENDING,
          },
          {
            finalApproverId: session.user.id,
            status: RequestStatus.FOR_FINAL_APPROVAL,
            finalApprovalStatus: ApprovalStatus.PENDING,
          }
        ]
      },
      include: {
        items: true,
        businessUnit: true,
        department: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedRequests = requests.map(request => ({
      ...request,
      freight: request.freight.toNumber(),
      discount: request.discount.toNumber(),
      total: request.total.toNumber(),
      items: request.items.map(item => ({
        ...item,
        quantity: item.quantity.toNumber(),
        unitPrice: item.unitPrice?.toNumber() || null,
        totalPrice: item.totalPrice?.toNumber() || null,
      }))
    }))

    return serializedRequests
  } catch (error) {
    console.error("Error fetching pending approvals:", error)
    return []
  }
}

export async function getPostedRequests(filters?: {
  businessUnitId?: string
  search?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    // Check if user has permission to view posted requests
    if (!["ADMIN", "MANAGER", "PURCHASER", "STOCKROOM"].includes(session.user.role)) {
      return []
    }

    const where: Record<string, unknown> = {
      status: RequestStatus.POSTED
    }

    if (filters?.businessUnitId) {
      where.businessUnitId = filters.businessUnitId
    }

    if (filters?.search) {
      where.OR = [
        { docNo: { contains: filters.search, mode: 'insensitive' } },
        { purpose: { contains: filters.search, mode: 'insensitive' } },
        { confirmationNo: { contains: filters.search, mode: 'insensitive' } },
        { requestedBy: { 
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } }
          ]
        }}
      ]
    }

    const requests = await prisma.materialRequest.findMany({
      where,
      include: {
        items: true,
        businessUnit: true,
        department: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        recApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        finalApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
      },
      orderBy: {
        datePosted: 'desc'
      }
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedRequests = requests.map(request => ({
      ...request,
      freight: request.freight.toNumber(),
      discount: request.discount.toNumber(),
      total: request.total.toNumber(),
      items: request.items.map(item => ({
        ...item,
        quantity: item.quantity.toNumber(),
        unitPrice: item.unitPrice?.toNumber() || null,
        totalPrice: item.totalPrice?.toNumber() || null,
      }))
    }))

    return serializedRequests
  } catch (error) {
    console.error("Error fetching posted requests:", error)
    return []
  }
}

export async function getReceivedRequests(filters?: {
  businessUnitId?: string
  search?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    // Check if user has permission to view received requests
    if (!["ADMIN", "MANAGER", "PURCHASER", "STOCKROOM"].includes(session.user.role)) {
      return []
    }

    const where: Record<string, unknown> = {
      status: RequestStatus.RECEIVED
    }

    if (filters?.businessUnitId) {
      where.businessUnitId = filters.businessUnitId
    }

    if (filters?.search) {
      where.OR = [
        { docNo: { contains: filters.search, mode: 'insensitive' } },
        { purpose: { contains: filters.search, mode: 'insensitive' } },
        { confirmationNo: { contains: filters.search, mode: 'insensitive' } },
        { requestedBy: { 
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } }
          ]
        }}
      ]
    }

    const requests = await prisma.materialRequest.findMany({
      where,
      include: {
        items: true,
        businessUnit: true,
        department: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        recApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        finalApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
      },
      orderBy: {
        dateReceived: 'desc'
      }
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedRequests = requests.map(request => ({
      ...request,
      freight: request.freight.toNumber(),
      discount: request.discount.toNumber(),
      total: request.total.toNumber(),
      items: request.items.map(item => ({
        ...item,
        quantity: item.quantity.toNumber(),
        unitPrice: item.unitPrice?.toNumber() || null,
        totalPrice: item.totalPrice?.toNumber() || null,
      }))
    }))

    return serializedRequests
  } catch (error) {
    console.error("Error fetching received requests:", error)
    return []
  }
}