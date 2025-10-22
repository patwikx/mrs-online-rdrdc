"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { ApproverType } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/auth"

// Validation schemas
const AssignApproverSchema = z.object({
  departmentId: z.string().min(1, "Department is required"),
  userId: z.string().min(1, "User is required"),
  approverType: z.enum([ApproverType.RECOMMENDING, ApproverType.FINAL]),
})

const RemoveApproverSchema = z.object({
  approverId: z.string().min(1, "Approver ID is required"),
})

export type AssignApproverInput = z.infer<typeof AssignApproverSchema>
export type RemoveApproverInput = z.infer<typeof RemoveApproverSchema>

export interface ActionResult {
  success: boolean
  message: string
  data?: unknown
}

export async function assignApprover(input: AssignApproverInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has admin privileges
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" }
    }

    const validatedData = AssignApproverSchema.parse(input)

    // Check if user is already assigned as this type of approver for this department
    const existingApprover = await prisma.departmentApprover.findFirst({
      where: {
        departmentId: validatedData.departmentId,
        userId: validatedData.userId,
        approverType: validatedData.approverType,
      }
    })

    if (existingApprover) {
      return { 
        success: false, 
        message: "User is already assigned as this type of approver for this department" 
      }
    }

    // Create the approver assignment
    const approver = await prisma.departmentApprover.create({
      data: {
        departmentId: validatedData.departmentId,
        userId: validatedData.userId,
        approverType: validatedData.approverType,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        },
        department: {
          include: {
            businessUnit: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          }
        }
      }
    })

    revalidatePath("/admin/approvers")
    
    return {
      success: true,
      message: "Approver assigned successfully",
      data: approver
    }
  } catch (error) {
    console.error("Error assigning approver:", error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message || "Validation error"
      }
    }

    return {
      success: false,
      message: "Failed to assign approver"
    }
  }
}

export async function removeApprover(input: RemoveApproverInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has admin privileges
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" }
    }

    const validatedData = RemoveApproverSchema.parse(input)

    // Check if approver exists
    const existingApprover = await prisma.departmentApprover.findUnique({
      where: { id: validatedData.approverId }
    })

    if (!existingApprover) {
      return { success: false, message: "Approver not found" }
    }

    // Remove the approver assignment
    await prisma.departmentApprover.delete({
      where: { id: validatedData.approverId }
    })

    revalidatePath("/admin/approvers")
    
    return {
      success: true,
      message: "Approver removed successfully"
    }
  } catch (error) {
    console.error("Error removing approver:", error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message || "Validation error"
      }
    }

    return {
      success: false,
      message: "Failed to remove approver"
    }
  }
}

export async function toggleApproverStatus(approverId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has admin privileges
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" }
    }

    // Get current approver
    const existingApprover = await prisma.departmentApprover.findUnique({
      where: { id: approverId }
    })

    if (!existingApprover) {
      return { success: false, message: "Approver not found" }
    }

    // Toggle the status
    await prisma.departmentApprover.update({
      where: { id: approverId },
      data: {
        isActive: !existingApprover.isActive
      }
    })

    revalidatePath("/admin/approvers")
    
    return {
      success: true,
      message: `Approver ${existingApprover.isActive ? 'deactivated' : 'activated'} successfully`
    }
  } catch (error) {
    console.error("Error toggling approver status:", error)
    
    return {
      success: false,
      message: "Failed to update approver status"
    }
  }
}

// Get functions
export async function getDepartmentsWithApprovers() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const departments = await prisma.department.findMany({
      where: {
        isActive: true
      },
      include: {
        businessUnit: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        approvers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              }
            }
          },
          orderBy: [
            { approverType: 'asc' },
            { createdAt: 'desc' }
          ]
        }
      },
      orderBy: [
        { businessUnit: { name: 'asc' } },
        { name: 'asc' }
      ]
    })

    return departments
  } catch (error) {
    console.error("Error fetching departments with approvers:", error)
    return []
  }
}

export async function getEligibleUsers() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    // Get users who can be approvers (excluding basic roles)
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "MANAGER", "PURCHASER", "ACCTG", "TREASURY"]
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    return users
  } catch (error) {
    console.error("Error fetching eligible users:", error)
    return []
  }
}

export async function getDepartmentApprovers(departmentId: string) {
  try {
    const approvers = await prisma.departmentApprover.findMany({
      where: {
        departmentId: departmentId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        },
        department: {
          include: {
            businessUnit: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          }
        }
      },
      orderBy: [
        { approverType: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return approvers
  } catch (error) {
    console.error("Error fetching department approvers:", error)
    return []
  }
}