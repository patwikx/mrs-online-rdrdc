"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Package, 
  CheckCircle2, 
  DollarSign,
  Users,
  Eye,
  Plus
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import type { DashboardData } from "@/lib/actions/dashboard-actions"

interface DashboardClientProps {
  data: DashboardData
  businessUnitId: string
  userRole: string
}

const REQUEST_STATUS_LABELS: Record<string, string> = {
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
  FOR_EDIT: "For Edit"
}

const REQUEST_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  FOR_REC_APPROVAL: "bg-yellow-100 text-yellow-800",
  REC_APPROVED: "bg-blue-100 text-blue-800",
  FOR_FINAL_APPROVAL: "bg-orange-100 text-orange-800",
  FINAL_APPROVED: "bg-green-100 text-green-800",
  FOR_POSTING: "bg-purple-100 text-purple-800",
  POSTED: "bg-blue-100 text-blue-800",
  RECEIVED: "bg-green-100 text-green-800",
  TRANSMITTED: "bg-indigo-100 text-indigo-800",
  CANCELLED: "bg-red-100 text-red-800",
  DISAPPROVED: "bg-red-100 text-red-800",
  FOR_EDIT: "bg-yellow-100 text-yellow-800"
}

export function DashboardClient({ data, businessUnitId, userRole }: DashboardClientProps) {
  const { stats, recentRequests, myRecentRequests, statusDistribution, businessUnit } = data

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM dd, yyyy")
  }

  const canViewApprovals = ["ADMIN", "MANAGER", "OWNER"].includes(userRole)
  const canViewMRSCoordinator = ["ADMIN", "MANAGER", "PURCHASER", "STOCKROOM"].includes(userRole)

  return (
    <div className="flex-1 space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {businessUnit ? `${businessUnit.name} (${businessUnit.code})` : "Material Request System Overview"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/${businessUnitId}/material-requests/create`}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              All material requests
            </p>
          </CardContent>
        </Card>

        {canViewApprovals && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your approval
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.myPendingRequests} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              All requests combined
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MRS Coordinator Stats (if applicable) */}
      {canViewMRSCoordinator && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready for Posting</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedRequests}</div>
              <p className="text-xs text-muted-foreground">
                Final approved requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posted Requests</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.postedRequests}</div>
              <p className="text-xs text-muted-foreground">
                Ready to mark as done
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Done Requests</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">{stats.doneRequests}</div>
              <p className="text-xs text-muted-foreground">
                Completed requests
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Status Distribution */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
            <CardDescription>
              Overview of all request statuses in this business unit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusDistribution.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={REQUEST_STATUS_COLORS[item.status] || "bg-gray-100 text-gray-800"}>
                      {REQUEST_STATUS_LABELS[item.status] || item.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {item.count} requests
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and navigation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href={`/${businessUnitId}/material-requests/create`}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Request
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href={`/${businessUnitId}/material-requests/my-requests`}>
                <FileText className="h-4 w-4 mr-2" />
                View My Requests
              </Link>
            </Button>

            {canViewApprovals && (
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href={`/${businessUnitId}/approvals/pending`}>
                  <Clock className="h-4 w-4 mr-2" />
                  Pending Approvals ({stats.pendingApprovals})
                </Link>
              </Button>
            )}

            {canViewMRSCoordinator && (
              <>
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href={`/${businessUnitId}/approvals/approved`}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approved Requests ({stats.approvedRequests})
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href={`/${businessUnitId}/mrs-coordinator/posted`}>
                    <Package className="h-4 w-4 mr-2" />
                    Posted Requests ({stats.postedRequests})
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Requests (All) */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>
              Latest material requests in this business unit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>No requests found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{request.docNo}</span>
                        <Badge className={`text-xs ${REQUEST_STATUS_COLORS[request.status] || "bg-gray-100 text-gray-800"}`}>
                          {REQUEST_STATUS_LABELS[request.status] || request.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.requestedBy.firstName} {request.requestedBy.lastName} • {formatDate(request.datePrepared)}
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(request.total)}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${businessUnitId}/material-requests/${request.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>My Recent Requests</CardTitle>
            <CardDescription>
              Your latest material requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myRecentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>No requests found</p>
                <Button asChild className="mt-2">
                  <Link href={`/${businessUnitId}/material-requests/create`}>
                    Create Your First Request
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myRecentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{request.docNo}</span>
                        <Badge className={`text-xs ${REQUEST_STATUS_COLORS[request.status] || "bg-gray-100 text-gray-800"}`}>
                          {REQUEST_STATUS_LABELS[request.status] || request.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(request.datePrepared)} • {request.type}
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(request.total)}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${businessUnitId}/material-requests/${request.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}