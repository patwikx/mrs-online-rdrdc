"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { auth } from "@/auth"

// Validation schemas
const CreateBusinessUnitSchema = z.object({
  code: z.string().min(1, "Code is required").max(10, "Code must be 10 characters or less"),
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().optional(),
})

const UpdateBusinessUnitSchema = z.object({
  id: z.string().min(1, "ID is required"),
  code: z.string().min(1, "Code is required").max(10, "Code must be 10 characters or less"),
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().optional(),
  isActive: z.boolean(),
})

export type CreateBusinessUnitInput = z.infer<typeof CreateBusinessUnitSchema>
export type UpdateBusinessUnitInput = z.infer<typeof UpdateBusinessUnitSchema>

export interface ActionResult {
  success: boolean
  message: string
  data?: unknown
}

export async function createBusinessUnit(input: CreateBusinessUnitInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has admin privileges
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" }
    }

    const validatedData = CreateBusinessUnitSchema.parse(input)

    // Check if code already exists
    const existingBusinessUnit = await prisma.businessUnit.findUnique({
      where: { code: validatedData.code }
    })

    if (existingBusinessUnit) {
      return { success: false, message: "Business unit code already exists" }
    }

    // Create the business unit
    const businessUnit = await prisma.businessUnit.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description || null,
        isActive: true,
      },
      include: {
        departments: true,
      }
    })

    revalidatePath("/admin/business-units")
    
    return {
      success: true,
      message: "Business unit created successfully",
      data: businessUnit
    }
  } catch (error) {
    console.error("Error creating business unit:", error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message || "Validation error"
      }
    }

    return {
      success: false,
      message: "Failed to create business unit"
    }
  }
}

export async function updateBusinessUnit(input: UpdateBusinessUnitInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has admin privileges
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" }
    }

    const validatedData = UpdateBusinessUnitSchema.parse(input)

    // Check if business unit exists
    const existingBusinessUnit = await prisma.businessUnit.findUnique({
      where: { id: validatedData.id }
    })

    if (!existingBusinessUnit) {
      return { success: false, message: "Business unit not found" }
    }

    // Check if code already exists (excluding current business unit)
    const codeExists = await prisma.businessUnit.findFirst({
      where: {
        code: validatedData.code,
        id: { not: validatedData.id }
      }
    })

    if (codeExists) {
      return { success: false, message: "Business unit code already exists" }
    }

    // Update the business unit
    const businessUnit = await prisma.businessUnit.update({
      where: { id: validatedData.id },
      data: {
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description || null,
        isActive: validatedData.isActive,
      },
      include: {
        departments: true,
      }
    })

    revalidatePath("/admin/business-units")
    
    return {
      success: true,
      message: "Business unit updated successfully",
      data: businessUnit
    }
  } catch (error) {
    console.error("Error updating business unit:", error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message || "Validation error"
      }
    }

    return {
      success: false,
      message: "Failed to update business unit"
    }
  }
}

export async function deleteBusinessUnit(businessUnitId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has admin privileges
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" }
    }

    // Check if business unit exists
    const existingBusinessUnit = await prisma.businessUnit.findUnique({
      where: { id: businessUnitId },
      include: {
        departments: true,
        requests: true,
      }
    })

    if (!existingBusinessUnit) {
      return { success: false, message: "Business unit not found" }
    }

    // Check if business unit has dependencies
    if (existingBusinessUnit.departments.length > 0) {
      return { success: false, message: "Cannot delete business unit with existing departments" }
    }

    if (existingBusinessUnit.requests.length > 0) {
      return { success: false, message: "Cannot delete business unit with existing requests" }
    }

    // Delete the business unit
    await prisma.businessUnit.delete({
      where: { id: businessUnitId }
    })

    revalidatePath("/admin/business-units")
    
    return {
      success: true,
      message: "Business unit deleted successfully"
    }
  } catch (error) {
    console.error("Error deleting business unit:", error)
    
    return {
      success: false,
      message: "Failed to delete business unit"
    }
  }
}

export async function toggleBusinessUnitStatus(businessUnitId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has admin privileges
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" }
    }

    // Get current business unit
    const existingBusinessUnit = await prisma.businessUnit.findUnique({
      where: { id: businessUnitId }
    })

    if (!existingBusinessUnit) {
      return { success: false, message: "Business unit not found" }
    }

    // Toggle the status
    await prisma.businessUnit.update({
      where: { id: businessUnitId },
      data: {
        isActive: !existingBusinessUnit.isActive
      }
    })

    revalidatePath("/admin/business-units")
    
    return {
      success: true,
      message: `Business unit ${existingBusinessUnit.isActive ? 'deactivated' : 'activated'} successfully`
    }
  } catch (error) {
    console.error("Error toggling business unit status:", error)
    
    return {
      success: false,
      message: "Failed to update business unit status"
    }
  }
}

// Get functions
export async function getBusinessUnits() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const businessUnits = await prisma.businessUnit.findMany({
      include: {
        departments: {
          include: {
            _count: {
              select: {
                users: true,
                requests: true,
                approvers: true,
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return businessUnits
  } catch (error) {
    console.error("Error fetching business units:", error)
    return []
  }
}

export async function getBusinessUnitById(businessUnitId: string) {
  try {
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: businessUnitId },
      include: {
        departments: {
          include: {
            _count: {
              select: {
                users: true,
                requests: true,
                approvers: true,
              }
            }
          }
        }
      }
    })

    return businessUnit
  } catch (error) {
    console.error("Error fetching business unit:", error)
    return null
  }
}