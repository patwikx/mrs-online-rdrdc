"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import bcrypt from "bcryptjs"

// Validation schemas
const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  contactNo: z.string().optional(),
})

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const CreateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  contactNo: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "TENANT", "TREASURY", "PURCHASER", "ACCTG", "VIEWER", "OWNER", "STOCKROOM", "MAINTENANCE"]),
  mrsDepartmentId: z.string().optional(),
})

const UpdateUserSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  contactNo: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "TENANT", "TREASURY", "PURCHASER", "ACCTG", "VIEWER", "OWNER", "STOCKROOM", "MAINTENANCE"]),
  mrsDepartmentId: z.string().optional(),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

export interface ActionResult {
  success: boolean
  message: string
  data?: unknown
}

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  contactNo: string | null
  role: string
  createdAt: Date
  updatedAt: Date
  mrsUserDepartment: {
    id: string
    name: string
    code: string
    businessUnit: {
      id: string
      name: string
      code: string
    }
  } | null
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNo: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        mrsUserDepartment: {
          select: {
            id: true,
            name: true,
            code: true,
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

    return user
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const validatedData = UpdateProfileSchema.parse(input)

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        id: { not: session.user.id }
      }
    })

    if (existingUser) {
      return { success: false, message: "Email is already taken by another user" }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        contactNo: validatedData.contactNo || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNo: true,
      }
    })

    revalidatePath("/settings/profile")
    
    return {
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        message: `Validation error: ${firstError.message}`
      }
    }

    return {
      success: false,
      message: "Failed to update profile"
    }
  }
}

export async function changePassword(input: ChangePasswordInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const validatedData = ChangePasswordSchema.parse(input)

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
      }
    })

    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return { success: false, message: "Current password is incorrect" }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedNewPassword,
      }
    })

    revalidatePath("/settings/profile")
    
    return {
      success: true,
      message: "Password changed successfully"
    }
  } catch (error) {
    console.error("Error changing password:", error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        message: `Validation error: ${firstError.message}`
      }
    }

    return {
      success: false,
      message: "Failed to change password"
    }
  }
}

export async function getBusinessUnits() {
  try {
    const businessUnits = await prisma.businessUnit.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
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

export async function getDepartments() {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        businessUnitId: true,
        businessUnit: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return departments
  } catch (error) {
    console.error("Error fetching departments:", error)
    return []
  }
}

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNo: true,
        role: true,
        mrsDepartmentId: true,
        createdAt: true,
        mrsUserDepartment: {
          select: {
            id: true,
            name: true,
            code: true,
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
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    return users
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function createUser(input: CreateUserInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has permission to create users (only ADMIN and MANAGER)
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "You don't have permission to create users" }
    }

    const validatedData = CreateUserSchema.parse(input)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return { success: false, message: "Email is already taken" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        password: hashedPassword,
        contactNo: validatedData.contactNo || null,
        role: validatedData.role,
        mrsDepartmentId: validatedData.mrsDepartmentId || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNo: true,
        role: true,
        createdAt: true,
      }
    })

    revalidatePath("/admin/users")
    
    return {
      success: true,
      message: "User created successfully",
      data: newUser
    }
  } catch (error) {
    console.error("Error creating user:", error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        message: `Validation error: ${firstError.message}`
      }
    }

    return {
      success: false,
      message: "Failed to create user"
    }
  }
}

export async function updateUser(input: UpdateUserInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has permission to update users (only ADMIN and MANAGER)
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "You don't have permission to update users" }
    }

    const validatedData = UpdateUserSchema.parse(input)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: validatedData.id }
    })

    if (!existingUser) {
      return { success: false, message: "User not found" }
    }

    // Check if email is already taken by another user
    const emailTaken = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        id: { not: validatedData.id }
      }
    })

    if (emailTaken) {
      return { success: false, message: "Email is already taken by another user" }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.id },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        contactNo: validatedData.contactNo || null,
        role: validatedData.role,
        mrsDepartmentId: validatedData.mrsDepartmentId || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNo: true,
        role: true,
        updatedAt: true,
      }
    })

    revalidatePath("/admin/users")
    
    return {
      success: true,
      message: "User updated successfully",
      data: updatedUser
    }
  } catch (error) {
    console.error("Error updating user:", error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        message: `Validation error: ${firstError.message}`
      }
    }

    return {
      success: false,
      message: "Failed to update user"
    }
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user has permission to delete users (only ADMIN and MANAGER)
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, message: "You don't have permission to delete users" }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return { success: false, message: "User not found" }
    }

    // Prevent users from deleting themselves
    if (userId === session.user.id) {
      return { success: false, message: "You cannot delete your own account" }
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    })

    revalidatePath("/admin/users")
    
    return {
      success: true,
      message: "User deleted successfully"
    }
  } catch (error) {
    console.error("Error deleting user:", error)
    
    return {
      success: false,
      message: "Failed to delete user"
    }
  }
}