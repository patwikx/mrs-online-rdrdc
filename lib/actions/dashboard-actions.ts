"use server"

import { prisma } from "@/lib/prisma"
import { RequestStatus } from "@prisma/client"
import { auth } from "@/auth"

export interface DashboardStats {
  totalRequests: number
  pendingApprovals: number
  approvedRequests: number
  postedRequests: number
  doneRequests: number
  myRequests: number
  myPendingRequests: number
  totalAmount: number
}

export interface RecentRequest {
  id: string
  docNo: string
  type: string
  status: string
  datePrepared: Date
  total: number
  requestedBy: {
    firstName: string
    lastName: string
  }
}

export interface StatusDistribution {
  status: string
  count: number
  percentage: number
}

export interface DashboardData {
  stats: DashboardStats
  recentRequests: RecentRequest[]
  myRecentRequests: RecentRequest[]
  statusDistribution: StatusDistribution[]
  businessUnit: {
    id: string
    name: string
    code: string
  } | null
}

export async function getDashboardData(businessUnitId: string, userId: string): Promise<DashboardData> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Get business unit info
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: businessUnitId },
      select: {
        id: true,
        name: true,
        code: true,
      }
    })

    // Get all requests for this business unit
    const allRequests = await prisma.materialRequest.findMany({
      where: { businessUnitId },
      include: {
        requestedBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get user's requests
    const myRequests = await prisma.materialRequest.findMany({
      where: { 
        businessUnitId,
        requestedById: userId
      },
      include: {
        requestedBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Get pending approvals for user (if they're an approver)
    const pendingApprovals = await prisma.materialRequest.findMany({
      where: {
        businessUnitId,
        OR: [
          {
            recApproverId: userId,
            status: RequestStatus.FOR_REC_APPROVAL,
          },
          {
            finalApproverId: userId,
            status: RequestStatus.FOR_FINAL_APPROVAL,
          }
        ]
      }
    })

    // Calculate stats
    const totalRequests = allRequests.length
    const approvedRequests = allRequests.filter(r => r.status === RequestStatus.FINAL_APPROVED).length
    const postedRequests = allRequests.filter(r => r.status === RequestStatus.POSTED).length
    const doneRequests = allRequests.filter(r => r.status === RequestStatus.RECEIVED).length
    const myRequestsCount = myRequests.length
    const myPendingRequestsCount = myRequests.filter(r => 
      ["DRAFT", "FOR_REC_APPROVAL", "FOR_FINAL_APPROVAL"].includes(r.status)
    ).length

    const totalAmount = allRequests.reduce((sum, request) => {
      return sum + request.total.toNumber()
    }, 0)

    // Calculate status distribution
    const statusCounts: Record<string, number> = {}
    allRequests.forEach(request => {
      statusCounts[request.status] = (statusCounts[request.status] || 0) + 1
    })

    const statusDistribution: StatusDistribution[] = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0
    }))

    // Get recent requests (last 5)
    const recentRequests: RecentRequest[] = allRequests.slice(0, 5).map(request => ({
      id: request.id,
      docNo: request.docNo,
      type: request.type,
      status: request.status,
      datePrepared: request.datePrepared,
      total: request.total.toNumber(),
      requestedBy: request.requestedBy
    }))

    const myRecentRequests: RecentRequest[] = myRequests.map(request => ({
      id: request.id,
      docNo: request.docNo,
      type: request.type,
      status: request.status,
      datePrepared: request.datePrepared,
      total: request.total.toNumber(),
      requestedBy: request.requestedBy
    }))

    const stats: DashboardStats = {
      totalRequests,
      pendingApprovals: pendingApprovals.length,
      approvedRequests,
      postedRequests,
      doneRequests,
      myRequests: myRequestsCount,
      myPendingRequests: myPendingRequestsCount,
      totalAmount
    }

    return {
      stats,
      recentRequests,
      myRecentRequests,
      statusDistribution,
      businessUnit
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    
    // Return empty data structure on error
    return {
      stats: {
        totalRequests: 0,
        pendingApprovals: 0,
        approvedRequests: 0,
        postedRequests: 0,
        doneRequests: 0,
        myRequests: 0,
        myPendingRequests: 0,
        totalAmount: 0
      },
      recentRequests: [],
      myRecentRequests: [],
      statusDistribution: [],
      businessUnit: null
    }
  }
}