/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, MoreHorizontal, Eye, Package, CheckCircle, Building, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { MaterialRequest, REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from "@/types/material-request-types"
import { RequestStatus } from "@prisma/client"
import { markAsPosted, markAsReceived } from "@/lib/actions/material-request-actions"
import { format } from "date-fns"

interface ApprovedRequestsClientProps {
  initialRequests: MaterialRequest[]
  userRole: string
  businessUnitId: string
}

export function ApprovedRequestsClient({ initialRequests, userRole, businessUnitId }: ApprovedRequestsClientProps) {
  const router = useRouter()
  const [requests, setRequests] = useState<MaterialRequest[]>(initialRequests)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("ALL")
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false)
  const [confirmationNo, setConfirmationNo] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const getDetailUrl = (requestId: string) => {
    return `/${businessUnitId}/approvals/approved/${requestId}`
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch = 
        request.docNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestedBy.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestedBy.lastName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "ALL" || request.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [requests, searchTerm, statusFilter])

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
    return format(new Date(date), "MMM dd, yyyy")
  }

  const handlePost = async () => {
    if (!selectedRequest) return

    setIsLoading(true)
    try {
      const result = await markAsPosted(selectedRequest.id, confirmationNo || undefined)
      if (result.success) {
        // Remove the request from the list since it's now posted and should appear in the posted requests page
        setRequests(prev => prev.filter(r => r.id !== selectedRequest.id))
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to post request")
    } finally {
      setIsLoading(false)
      setIsPostDialogOpen(false)
      setSelectedRequest(null)
      setConfirmationNo("")
    }
  }

  const handleReceive = async () => {
    if (!selectedRequest) return

    setIsLoading(true)
    try {
      const result = await markAsReceived(selectedRequest.id)
      if (result.success) {
        // Remove the request from the list since it's now received and should appear in the received items page
        setRequests(prev => prev.filter(r => r.id !== selectedRequest.id))
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to receive request")
    } finally {
      setIsLoading(false)
      setIsReceiveDialogOpen(false)
      setSelectedRequest(null)
    }
  }

  const canPost = (request: MaterialRequest) => {
    return request.status === RequestStatus.FINAL_APPROVED && 
           ["ADMIN", "MANAGER", "PURCHASER"].includes(userRole)
  }

  const canReceive = (request: MaterialRequest) => {
    return request.status === RequestStatus.POSTED && 
           ["ADMIN", "MANAGER", "PURCHASER", "STOCKROOM"].includes(userRole)
  }

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.FINAL_APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case RequestStatus.POSTED:
        return <FileText className="h-4 w-4 text-blue-600" />
      case RequestStatus.RECEIVED:
        return <Package className="h-4 w-4 text-teal-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="flex-1 space-y-4 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Approved Requests</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage posting and receiving of approved material requests
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequestStatus | "ALL")}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Approved</SelectItem>
            <SelectItem value={RequestStatus.FINAL_APPROVED}>Final Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRequests.length} approved requests
      </div>

      {/* Desktop Table View */}
      <div className="rounded-md border hidden sm:block">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="flex flex-col items-center space-y-2">
              <Package className="h-8 w-8" />
              <p className="text-lg font-medium">No approved requests found</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== "ALL"
                  ? "No requests match your current filters."
                  : "No approved requests available."
                }
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doc No.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Business Unit</TableHead>
                <TableHead>Date Approved</TableHead>
                <TableHead>Date Posted</TableHead>
                <TableHead>Date Received</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <div>
                        <div className="font-medium">{request.docNo}</div>
                        <div className="text-xs text-muted-foreground">
                          {request.confirmationNo && `Conf: ${request.confirmationNo}`}
                        </div>
                      </div>
                    </div>
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
                    <div className="text-sm">{formatDate(request.dateApproved)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(request.datePosted)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(request.dateReceived)}</div>
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
                          onClick={() => router.push(getDetailUrl(request.id))}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        
                        {canPost(request) && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRequest(request)
                              setIsPostDialogOpen(true)
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Mark as Posted
                          </DropdownMenuItem>
                        )}
                        
                        {canReceive(request) && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRequest(request)
                              setIsReceiveDialogOpen(true)
                            }}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Mark as Received
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
              <Package className="h-8 w-8" />
              <p className="text-lg font-medium">No approved requests found</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== "ALL"
                  ? "No requests match your current filters."
                  : "No approved requests available."
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="rounded-lg border bg-card p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <div>
                      <div className="font-semibold text-base">{request.docNo}</div>
                      {request.confirmationNo && (
                        <div className="text-xs text-muted-foreground">
                          Conf: {request.confirmationNo}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={`text-xs ${REQUEST_STATUS_COLORS[request.status]}`}>
                    {REQUEST_STATUS_LABELS[request.status]}
                  </Badge>
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
                    <span className="text-sm text-muted-foreground">Business Unit:</span>
                    <span className="text-sm">{request.businessUnit.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Items:</span>
                    <span className="text-sm">{request.items.length} item{request.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date Approved:</span>
                    <span className="text-sm">{formatDate(request.dateApproved)}</span>
                  </div>
                  {request.datePosted && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Date Posted:</span>
                      <span className="text-sm">{formatDate(request.datePosted)}</span>
                    </div>
                  )}
                  {request.dateReceived && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Date Received:</span>
                      <span className="text-sm">{formatDate(request.dateReceived)}</span>
                    </div>
                  )}
                </div>

                {/* Total Amount */}
                <div className="bg-muted/30 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-lg font-bold">{formatCurrency(request.total)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(getDetailUrl(request.id))}
                    className="flex-1"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  
                  {canPost(request) && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request)
                        setIsPostDialogOpen(true)
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Post
                    </Button>
                  )}
                  
                  {canReceive(request) && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request)
                        setIsReceiveDialogOpen(true)
                      }}
                      className="flex-1 bg-teal-600 hover:bg-teal-700"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Receive
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Confirmation Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Posted</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to mark &quot;{selectedRequest?.docNo}&quot; as posted?
            </p>
            <div className="space-y-2">
              <Label htmlFor="confirmationNo">Confirmation Number (Optional)</Label>
              <Input
                id="confirmationNo"
                placeholder="Enter confirmation number"
                value={confirmationNo}
                onChange={(e) => setConfirmationNo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePost} disabled={isLoading}>
              {isLoading ? "Posting..." : "Mark as Posted"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Confirmation Dialog */}
      <AlertDialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Received</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark &quot;{selectedRequest?.docNo}&quot; as received?
              This indicates that the materials have been delivered and received.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReceive}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Mark as Received"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}