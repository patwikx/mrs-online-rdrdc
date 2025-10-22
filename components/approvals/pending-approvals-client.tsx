/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useMemo } from "react"
import { MoreHorizontal, CheckCircle, XCircle, Eye, Search, Clock, FileText, Building, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApprovalStatus, RequestType } from "@prisma/client"
import { PendingApproval } from "@/types/approval-types"
import { REQUEST_TYPE_LABELS } from "@/types/material-request-types"
import { ApprovalDialog } from "./approval-dialog"

interface PendingApprovalsClientProps {
  initialApprovals: PendingApproval[]
  userRole: string
}

export function PendingApprovalsClient({ initialApprovals, userRole }: PendingApprovalsClientProps) {
  const [approvals, setApprovals] = useState(initialApprovals)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog states
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)
  const [approvalAction, setApprovalAction] = useState<ApprovalStatus | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Filter approvals
  const filteredApprovals = useMemo(() => {
    return approvals.filter(approval => {
      const matchesSearch = approval.docNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.requestedBy.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.requestedBy.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (approval.purpose && approval.purpose.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesType = selectedType === "all" || approval.type === selectedType
      const matchesBusinessUnit = selectedBusinessUnit === "all" || approval.businessUnitId === selectedBusinessUnit
      
      return matchesSearch && matchesType && matchesBusinessUnit
    })
  }, [approvals, searchTerm, selectedType, selectedBusinessUnit])

  // Pagination calculations
  const totalPages = Math.ceil(filteredApprovals.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedApprovals = filteredApprovals.slice(startIndex, endIndex)

  // Get unique business units for filter
  const businessUnits = useMemo(() => {
    const units = new Map()
    approvals.forEach(approval => {
      if (!units.has(approval.businessUnit.id)) {
        units.set(approval.businessUnit.id, approval.businessUnit)
      }
    })
    return Array.from(units.values())
  }, [approvals])

  // Reset to first page when filters change
  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1)
    if (filterType === 'search') setSearchTerm(value)
    if (filterType === 'type') setSelectedType(value)
    if (filterType === 'businessUnit') setSelectedBusinessUnit(value)
  }

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize))
    setCurrentPage(1)
  }

  const handleApprovalAction = (approval: PendingApproval, action: ApprovalStatus) => {
    setSelectedApproval(approval)
    setApprovalAction(action)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    // Refresh the page to get updated data
    window.location.reload()
  }

  const getApprovalType = (approval: PendingApproval) => {
    return approval.status === "FOR_REC_APPROVAL" ? "recommending" : "final"
  }

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Separate approvals by type
  const recApprovals = filteredApprovals.filter(a => a.status === "FOR_REC_APPROVAL")
  const finalApprovals = filteredApprovals.filter(a => a.status === "FOR_FINAL_APPROVAL")

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pending Approvals</h2>
          <p className="text-muted-foreground">
            Review and approve material requests assigned to you
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredApprovals.length}</div>
            <p className="text-xs text-muted-foreground">
              Requests awaiting your approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommending</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{recApprovals.length}</div>
            <p className="text-xs text-muted-foreground">
              First level approvals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Final</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{finalApprovals.length}</div>
            <p className="text-xs text-muted-foreground">
              Final level approvals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search approvals..."
              value={searchTerm}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-8 w-full sm:w-[300px]"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger className="flex-1 sm:w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={RequestType.ITEM}>Item Request</SelectItem>
                <SelectItem value={RequestType.SERVICE}>Service Request</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedBusinessUnit} onValueChange={(value) => handleFilterChange('businessUnit', value)}>
              <SelectTrigger className="flex-1 sm:w-[200px]">
                <SelectValue placeholder="All Business Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Business Units</SelectItem>
                {businessUnits.map((bu) => (
                  <SelectItem key={bu.id} value={bu.id}>
                    {bu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1} to {Math.min(endIndex, filteredApprovals.length)} of {filteredApprovals.length} approvals
      </div>

      {/* Desktop Table View */}
      <div className="rounded-md border hidden sm:block">
        {filteredApprovals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="flex flex-col items-center space-y-2">
              <Clock className="h-8 w-8" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p className="text-sm">
                {searchTerm || selectedType !== "all" || selectedBusinessUnit !== "all"
                  ? "No approvals match your current filters."
                  : "All caught up! No requests are waiting for your approval."
                }
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Business Unit</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Date Required</TableHead>
                <TableHead>Approval Level</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedApprovals.map((approval) => (
                <TableRow key={approval.id}>
                  <TableCell>
                    <div className="font-medium">{approval.docNo}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(approval.datePrepared)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {REQUEST_TYPE_LABELS[approval.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {approval.requestedBy.firstName} {approval.requestedBy.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {approval.requestedBy.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {approval.department?.name || "No Department"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{approval.businessUnit.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(approval.total)}</div>
                    <div className="text-xs text-muted-foreground">
                      {approval.items.length} item{approval.items.length !== 1 ? 's' : ''}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(approval.dateRequired)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={approval.status === "FOR_REC_APPROVAL" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}
                    >
                      {approval.status === "FOR_REC_APPROVAL" ? "Recommending" : "Final"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.open(`/material-requests/${approval.id}`, '_blank')}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleApprovalAction(approval, ApprovalStatus.APPROVED)}
                          className="text-green-600"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleApprovalAction(approval, ApprovalStatus.DISAPPROVED)}
                          className="text-red-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Disapprove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden">
        {filteredApprovals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="flex flex-col items-center space-y-2">
              <Clock className="h-8 w-8" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p className="text-sm">
                {searchTerm || selectedType !== "all" || selectedBusinessUnit !== "all"
                  ? "No approvals match your current filters."
                  : "All caught up! No requests are waiting for your approval."
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedApprovals.map((approval) => (
              <div key={approval.id} className="rounded-lg border bg-card p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-lg">{approval.docNo}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(approval.datePrepared)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-xs">
                      {REQUEST_TYPE_LABELS[approval.type]}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${approval.status === "FOR_REC_APPROVAL" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                    >
                      {approval.status === "FOR_REC_APPROVAL" ? "Recommending" : "Final"}
                    </Badge>
                  </div>
                </div>

                {/* Request Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Requested by:</span>
                    <span className="text-sm font-medium">
                      {approval.requestedBy.firstName} {approval.requestedBy.lastName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Department:</span>
                    <span className="text-sm">{approval.department?.name || "No Department"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Business Unit:</span>
                    <span className="text-sm">{approval.businessUnit.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Items:</span>
                    <span className="text-sm">{approval.items.length} item{approval.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Required by:</span>
                    <span className="text-sm">{formatDate(approval.dateRequired)}</span>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="bg-muted/30 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-lg font-bold">{formatCurrency(approval.total)}</span>
                  </div>
                </div>

                {/* Purpose */}
                {approval.purpose && (
                  <div className="text-sm">
                    <span className="font-medium">Purpose: </span>
                    <span className="text-muted-foreground italic">&quot;{approval.purpose}&quot;</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprovalAction(approval, ApprovalStatus.APPROVED)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleApprovalAction(approval, ApprovalStatus.DISAPPROVED)}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Disapprove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredApprovals.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">Rows per page</p>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Dialog */}
      {selectedApproval && approvalAction && (
        <ApprovalDialog
          approval={selectedApproval}
          approvalType={getApprovalType(selectedApproval)}
          action={approvalAction}
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}