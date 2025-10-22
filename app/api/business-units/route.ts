import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createBusinessUnitSchema = z.object({
  code: z.string().min(1, "Business unit code is required"),
  name: z.string().min(1, "Business unit name is required"),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user has permission to create business units (only ADMIN and MANAGER)
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { message: "You don't have permission to create business units" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createBusinessUnitSchema.parse(body)

    // Check if business unit code already exists
    const existingBusinessUnit = await prisma.businessUnit.findUnique({
      where: { code: validatedData.code }
    })

    if (existingBusinessUnit) {
      return NextResponse.json(
        { message: "Business unit code already exists" },
        { status: 400 }
      )
    }

    // Create the business unit
    const businessUnit = await prisma.businessUnit.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description || null,
        isActive: true,
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

    return NextResponse.json(businessUnit, { status: 201 })

  } catch (error) {
    console.error("Error creating business unit:", error)
    
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

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const businessUnits = await prisma.businessUnit.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            departments: true,
            requests: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(businessUnits)

  } catch (error) {
    console.error("Error fetching business units:", error)
    
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}