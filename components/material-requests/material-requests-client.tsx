/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Send, ChevronLeft, ChevronRight, Building, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { MaterialRequest, REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, REQUEST_TYPE_LABELS } from "@/types/material-request-types"
import { RequestStatus, RequestType } from "@prisma/client"
import { deleteMaterialRequest, submitForApproval } from "@/lib/actions/material-request-actions"


interface MaterialRequestsClientProps {
  initialRequests: MaterialRequest[]
}

export function MaterialRequestsClient({ initialRequests }: MaterialRequestsClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const businessUnitId = params.businessUnitId as string
  const [requests, setRequests] = useState<MaterialRequest[]>(initialRequests)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("ALL")
  const [typeFilter, setTypeFilter] = useState<RequestType | "ALL">("ALL")
  const [viewFilter, setViewFilter] = useState<"ALL" | "MY_REQUESTS" | "DRAFTS">("ALL")
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch = 
        request.docNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestedBy.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestedBy.lastName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "ALL" || request.status === statusFilter
      const matchesType = typeFilter === "ALL" || request.type === typeFilter
      
      let matchesView = true
      if (viewFilter === "MY_REQUESTS") {
        matchesView = request.requestedById === session?.user?.id
      } else if (viewFilter === "DRAFTS") {
        matchesView = request.status === RequestStatus.DRAFT && request.requestedById === session?.user?.id
      }

      return matchesSearch && matchesStatus && matchesType && matchesView
    })
  }, [requests, searchTerm, statusFilter, typeFilter, viewFilter, session?.user?.id])

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1)
    if (filterType === 'search') setSearchTerm(value)
    if (filterType === 'status') setStatusFilter(value as RequestStatus | "ALL")
    if (filterType === 'type') setTypeFilter(value as RequestType | "ALL")
    if (filterType === 'view') setViewFilter(value as "ALL" | "MY_REQUESTS" | "DRAFTS")
  }

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize))
    setCurrentPage(1)
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

  const handleDelete = async () => {
    if (!selectedRequest) return

    setIsLoading(true)
    try {
      const result = await deleteMaterialRequest(selectedRequest.id)
      if (result.success) {
        setRequests(prev => prev.filter(r => r.id !== selectedRequest.id))
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to delete request")
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
      setSelectedRequest(null)
    }
  }

  const handleSubmitForApproval = async () => {
    if (!selectedRequest) return

    setIsLoading(true)
    try {
      const result = await submitForApproval(selectedRequest.id)
      if (result.success) {
        setRequests(prev => 
          prev.map(r => 
            r.id === selectedRequest.id 
              ? { ...r, status: RequestStatus.FOR_REC_APPROVAL }
              : r
          )
        )
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to submit request")
    } finally {
      setIsLoading(false)
      setIsSubmitDialogOpen(false)
      setSelectedRequest(null)
    }
  }

  const canEdit = (request: MaterialRequest) => {
    return (
      request.requestedById === session?.user?.id &&
      (request.status === RequestStatus.DRAFT || request.status === RequestStatus.FOR_EDIT)
    ) || ["ADMIN", "MANAGER"].includes(session?.user?.role || "")
  }

  const canDelete = (request: MaterialRequest) => {
    return (
      request.requestedById === session?.user?.id &&
      request.status === RequestStatus.DRAFT
    ) || ["ADMIN", "MANAGER"].includes(session?.user?.role || "")
  }

  const canSubmit = (request: MaterialRequest) => {
    return (
      request.requestedById === session?.user?.id &&
      request.status === RequestStatus.DRAFT
    )
  }

  return (
    <div className="flex-1 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Material Requests</h2>
          <p className="text-muted-foreground">
            Manage and track all material requests
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-8 w-full sm:w-[300px]"
            />
          </div>
          <div className="flex gap-2">
            <Select value={viewFilter} onValueChange={(value) => handleFilterChange('view', value)}>
              <SelectTrigger className="flex-1 sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Requests</SelectItem>
                <SelectItem value="MY_REQUESTS">My Requests</SelectItem>
                <SelectItem value="DRAFTS">Draft Requests</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="flex-1 sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>


          </div>
        </div>
        <div className="flex gap-2">
<Select value={typeFilter} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger className="flex-1 sm:w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        <Button onClick={() => router.push(`/${businessUnitId}/material-requests/create`)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Request
        </Button>
        </div>
                    
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} requests
      </div>

      {/* Desktop Table View */}
      <div className="rounded-md border hidden sm:block">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="flex flex-col items-center space-y-2">
              <Search className="h-8 w-8" />
              <p className="text-lg font-medium">No material requests found</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL" || viewFilter !== "ALL"
                  ? "No requests match your current filters."
                  : "Get started by creating your first material request."
                }
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doc No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Business Unit</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date Prepared</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="font-medium">{request.docNo}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(request.datePrepared)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {REQUEST_TYPE_LABELS[request.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={REQUEST_STATUS_COLORS[request.status]}>
                      {REQUEST_STATUS_LABELS[request.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {request.requestedBy.firstName} {request.requestedBy.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {request.requestedBy.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.businessUnit.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.department?.name || "No Department"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(request.datePrepared)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(request.total)}</div>
                    <div className="text-xs text-muted-foreground">
                      {request.items.length} item{request.items.length !== 1 ? 's' : ''}
                    </div>
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
                          onClick={() => router.push(`/${businessUnitId}/material-requests/${request.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        
                        {canEdit(request) && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/${businessUnitId}/material-requests/${request.id}`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        
                        {canSubmit(request) && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRequest(request)
                              setIsSubmitDialogOpen(true)
                            }}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Submit for Approval
                          </DropdownMenuItem>
                        )}
                        
                        {canDelete(request) && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedRequest(request)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
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
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="flex flex-col items-center space-y-2">
              <Search className="h-8 w-8" />
              <p className="text-lg font-medium">No material requests found</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL" || viewFilter !== "ALL"
                  ? "No requests match your current filters."
                  : "Get started by creating your first material request."
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedRequests.map((request) => (
              <div key={request.id} className="rounded-lg border bg-card p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-lg">{request.docNo}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(request.datePrepared)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-xs">
                      {REQUEST_TYPE_LABELS[request.type]}
                    </Badge>
                    <Badge className={`text-xs ${REQUEST_STATUS_COLORS[request.status]}`}>
                      {REQUEST_STATUS_LABELS[request.status]}
                    </Badge>
                  </div>
                </div>

                {/* Request Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Requested by:</span>
                    <span className="text-sm font-medium">
                      {request.requestedBy.firstName} {request.requestedBy.lastName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Department:</span>
                    <span className="text-sm">{request.department?.name || "No Department"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Business Unit:</span>
                    <span className="text-sm">{request.businessUnit.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Items:</span>
                    <span className="text-sm">{request.items.length} item{request.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Required by:</span>
                    <span className="text-sm">{formatDate(request.dateRequired)}</span>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="bg-muted/30 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-lg font-bold">{formatCurrency(request.total)}</span>
                  </div>
                </div>

                {/* Purpose */}
                {request.purpose && (
                  <div className="text-sm">
                    <span className="font-medium">Purpose: </span>
                    <span className="text-muted-foreground italic">&quot;{request.purpose}&quot;</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">                  
                  {canEdit(request) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/${businessUnitId}/material-requests/${request.id}`)}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  
                  {canSubmit(request) && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request)
                        setIsSubmitDialogOpen(true)
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit
                    </Button>
                  )}
                  
                  {canDelete(request) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request)
                        setIsDeleteDialogOpen(true)
                      }}
                      className="flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredRequests.length > 0 && (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the material request
              &quot;{selectedRequest?.docNo}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit &quot;{selectedRequest?.docNo}&quot; for approval?
              Once submitted, you will not be able to edit the request unless it&apos;s returned for editing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitForApproval}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}