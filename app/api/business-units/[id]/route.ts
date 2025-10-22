import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateBusinessUnitSchema = z.object({
  code: z.string().min(1, "Business unit code is required").optional(),
  name: z.string().min(1, "Business unit name is required").optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        departments: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            isActive: true,
          },
          where: { isActive: true },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: {
            departments: true,
            requests: true,
          }
        }
      }
    })

    if (!businessUnit) {
      return NextResponse.json(
        { message: "Business unit not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(businessUnit)

  } catch (error) {
    console.error("Error fetching business unit:", error)
    
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user has permission to update business units (only ADMIN and MANAGER)
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { message: "You don't have permission to update business units" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateBusinessUnitSchema.parse(body)

    // Check if business unit exists
    const existingBusinessUnit = await prisma.businessUnit.findUnique({
      where: { id }
    })

    if (!existingBusinessUnit) {
      return NextResponse.json(
        { message: "Business unit not found" },
        { status: 404 }
      )
    }

    // If updating code, check if new code already exists
    if (validatedData.code && validatedData.code !== existingBusinessUnit.code) {
      const codeExists = await prisma.businessUnit.findUnique({
        where: { code: validatedData.code }
      })

      if (codeExists) {
        return NextResponse.json(
          { message: "Business unit code already exists" },
          { status: 400 }
        )
      }
    }

    // Update the business unit
    const updatedBusinessUnit = await prisma.businessUnit.update({
      where: { id },
      data: {
        ...(validatedData.code && { code: validatedData.code }),
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description || null }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(updatedBusinessUnit)

  } catch (error) {
    console.error("Error updating business unit:", error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json(
        { message: `Validation error: ${firstError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user has permission to delete business units (only ADMIN)
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You don't have permission to delete business units" },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if business unit exists
    const existingBusinessUnit = await prisma.businessUnit.findUnique({
      where: { id },
      include: {
        departments: true,
        requests: true,
      }
    })

    if (!existingBusinessUnit) {
      return NextResponse.json(
        { message: "Business unit not found" },
        { status: 404 }
      )
    }

    // Check if business unit has dependencies
    if (existingBusinessUnit.departments.length > 0 || existingBusinessUnit.requests.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete business unit with existing departments or requests. Deactivate instead." },
        { status: 400 }
      )
    }

    // Delete the business unit
    await prisma.businessUnit.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: "Business unit deleted successfully" },
      { status: 200 }
    )

  } catch (error) {
    console.error("Error deleting business unit:", error)
    
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}