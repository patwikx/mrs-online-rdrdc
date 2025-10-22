"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { auth } from "@/auth"

// Validation schemas
const CreateDepartmentSchema = z.object({
  code: z.string().min(1, "Code is required").max(10, "Code must be 10 characters or less"),
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().optional(),
  businessUnitId: z.string().min(1, "Business unit is required"),
})

const UpdateDepartmentSchema = z.object({
  id: z.string().min(1, "ID is required"),
  code: z.string().min(1, "Code is required").max(10, "Code must be 10 characters or less"),
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().optional(),
  businessUnitId: z.string().min(1, "Business unit is required"),
  isActive: z.boolean(),
})

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>

export interface ActionResult {
  success: boolean
  message: string
  data?: unknown
}

export async function createDepartment(input: CreateDepartmentInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has admin privileges
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" }
    }

    const validatedData = CreateDepartmentSchema.parse(input)

    // Check if code already exists
    const existingDepartment = await prisma.department.findUnique({
      where: { code: validatedData.code }
    })

    if (existingDepartment) {
      return { success: false, message: "Department code already exists" }
    }

    // Check if business unit exists
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: validatedData.businessUnitId }
    })

    if (!businessUnit) {
      return { success: false, message: "Business unit not found" }
    }

    // Create the department
    const department = await prisma.department.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description || null,
        businessUnitId: validatedData.businessUnitId,
        isActive: true,
      },
      include: {
        businessUnit: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            users: true,
            requests: true,
            approvers: true,
          }
        }
      }
    })

    revalidatePath("/admin/departments")
    
    return {
      success: true,
      message: "Department created successfully",
      data: department
    }
  } catch (error) {
    console.error("Error creating department:", error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message || "Validation error"
      }
    }

    return {
      success: false,
      message: "Failed to create department"
    }
  }
}

export async function updateDepartment(input: UpdateDepartmentInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has admin privileges
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" }
    }

    const validatedData = UpdateDepartmentSchema.parse(input)

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id: validatedData.id }
    })

    if (!existingDepartment) {
      return { success: false, message: "Department not found" }
    }

    // Check if code already exists (excluding current department)
    const codeExists = await prisma.department.findFirst({
      where: {
        code: validatedData.code,
        id: { not: validatedData.id }
      }
    })

    if (codeExists) {
      return { success: false, message: "Department code already exists" }
    }

    // Check if business unit exists
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: validatedData.businessUnitId }
    })

    if (!businessUnit) {
      return { success: false, message: "Business unit not found" }
    }

    // Update the department
    const department = await prisma.department.update({
      where: { id: validatedData.id },
      data: {
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description || null,
        businessUnitId: validatedData.businessUnitId,
        isActive: validatedData.isActive,
      },
      include: {
        businessUnit: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            users: true,
            requests: true,
            approvers: true,
          }
        }
      }
    })

    revalidatePath("/admin/departments")
    
    return {
      success: true,
      message: "Department updated successfully",
      data: department
    }
  } catch (error) {
    console.error("Error updating department:", error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message || "Validation error"
      }
    }

    return {
      success: false,
      message: "Failed to update department"
    }
  }
}

export async function deleteDepartment(departmentId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has admin privileges
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" }
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        users: true,
        requests: true,
        approvers: true,
      }
    })

    if (!existingDepartment) {
      return { success: false, message: "Department not found" }
    }

    // Check if department has dependencies
    if (existingDepartment.users.length > 0) {
      return { success: false, message: "Cannot delete department with existing users" }
    }

    if (existingDepartment.requests.length > 0) {
      return { success: false, message: "Cannot delete department with existing requests" }
    }

    if (existingDepartment.approvers.length > 0) {
      return { success: false, message: "Cannot delete department with existing approvers" }
    }

    // Delete the department
    await prisma.department.delete({
      where: { id: departmentId }
    })

    revalidatePath("/admin/departments")
    
    return {
      success: true,
      message: "Department deleted successfully"
    }
  } catch (error) {
    console.error("Error deleting department:", error)
    
    return {
      success: false,
      message: "Failed to delete department"
    }
  }
}

export async function toggleDepartmentStatus(departmentId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has admin privileges
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions" }
    }

    // Get current department
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId }
    })

    if (!existingDepartment) {
      return { success: false, message: "Department not found" }
    }

    // Toggle the status
    await prisma.department.update({
      where: { id: departmentId },
      data: {
        isActive: !existingDepartment.isActive
      }
    })

    revalidatePath("/admin/departments")
    
    return {
      success: true,
      message: `Department ${existingDepartment.isActive ? 'deactivated' : 'activated'} successfully`
    }
  } catch (error) {
    console.error("Error toggling department status:", error)
    
    return {
      success: false,
      message: "Failed to update department status"
    }
  }
}

// Get functions
export async function getDepartments() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }

    const departments = await prisma.department.findMany({
      include: {
        businessUnit: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            users: true,
            requests: true,
            approvers: true,
          }
        }
      },
      orderBy: [
        { businessUnit: { name: 'asc' } },
        { name: 'asc' }
      ]
    })

    return departments
  } catch (error) {
    console.error("Error fetching departments:", error)
    return []
  }
}

export async function getDepartmentById(departmentId: string) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        businessUnit: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            users: true,
            requests: true,
            approvers: true,
          }
        }
      }
    })

    return department
  } catch (error) {
    console.error("Error fetching department:", error)
    return null
  }
}