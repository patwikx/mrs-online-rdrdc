"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Package, Eye, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MarkAsDoneDialog } from "./mark-as-done-dialog"

interface MaterialRequestItem {
  id: string
  itemCode: string | null
  description: string
  uom: string
  quantity: number
  unitPrice: number | null
  totalPrice: number | null
  remarks: string | null
}

interface MaterialRequest {
  id: string
  docNo: string
  series: string
  type: string
  status: string
  datePrepared: Date
  dateRequired: Date
  datePosted: Date | null
  dateReceived: Date | null
  businessUnit: {
    id: string
    name: string
    code: string
  }
  department: {
    id: string
    name: string
    code: string
  } | null
  chargeTo: string | null
  purpose: string | null
  remarks: string | null
  deliverTo: string | null
  freight: number
  discount: number
  total: number
  confirmationNo: string | null
  requestedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  recApprover: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  finalApprover: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  items: MaterialRequestItem[]
}

interface PostedRequestsClientProps {
  initialRequests: MaterialRequest[]
  userRole: string
  businessUnitId: string
}

export function PostedRequestsClient({ 
  initialRequests, 
  userRole, 
  businessUnitId 
}: PostedRequestsClientProps) {
  const [requests, setRequests] = useState<MaterialRequest[]>(initialRequests)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [isMarkAsDoneDialogOpen, setIsMarkAsDoneDialogOpen] = useState(false)
  const router = useRouter()

  const filteredRequests = useMemo(() => {
    if (!searchTerm) return requests

    return requests.filter(request => 
      request.docNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.confirmationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${request.requestedBy.firstName} ${request.requestedBy.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [requests, searchTerm])

  const handleMarkAsDone = (request: MaterialRequest) => {
    setSelectedRequest(request)
    setIsMarkAsDoneDialogOpen(true)
  }

  const handleMarkAsDoneSuccess = () => {
    if (selectedRequest) {
      // Remove the request from the list since it's now done
      setRequests(prev => prev.filter(req => req.id !== selectedRequest.id))
      router.refresh()
    }
    setSelectedRequest(null)
  }

  const canMarkAsDone = (userRole: string): boolean => {
    return ["ADMIN", "MANAGER", "PURCHASER", "STOCKROOM"].includes(userRole)
  }

  return (
    <div className="flex-1 space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Posted Requests</h1>
          <p className="text-sm text-muted-foreground">
            Manage posted material requests that are ready to be marked as done
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by document number, purpose, confirmation number, or requester..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRequests.length} of {requests.length} posted requests
      </div>

      {/* Desktop Table */}
      <div className="rounded-md border hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document No.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Date Posted</TableHead>
              <TableHead>Confirmation No.</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No posted requests found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.docNo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {request.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.requestedBy.firstName} {request.requestedBy.lastName}
                  </TableCell>
                  <TableCell>{request.department?.name || "N/A"}</TableCell>
                  <TableCell>
                    {request.datePosted ? format(new Date(request.datePosted), "MMM dd, yyyy") : "N/A"}
                  </TableCell>
                  <TableCell>{request.confirmationNo || "N/A"}</TableCell>
                  <TableCell>₱{request.total.toLocaleString()}</TableCell>
                  <TableCell>{request.items.length} items</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/${businessUnitId}/mrs-coordinator/posted/${request.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {canMarkAsDone(userRole) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleMarkAsDone(request)}
                          disabled={isLoading}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Done
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Package className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No posted requests found</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <CardTitle className="text-base">{request.docNo}</CardTitle>
                  </div>
                  <Badge variant="outline">
                    {request.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Requested by:</span>
                    <p className="font-medium">
                      {request.requestedBy.firstName} {request.requestedBy.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <p className="font-medium">{request.department?.name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date Posted:</span>
                    <p className="font-medium">
                      {request.datePosted ? format(new Date(request.datePosted), "MMM dd, yyyy") : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confirmation No:</span>
                    <p className="font-medium">{request.confirmationNo || "N/A"}</p>
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Amount</span>
                    <span className="text-lg font-semibold">₱{request.total.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {request.items.length} items
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/${businessUnitId}/mrs-coordinator/posted/${request.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                  {canMarkAsDone(userRole) && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleMarkAsDone(request)}
                      disabled={isLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Done
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Mark as Done Dialog */}
      {selectedRequest && (
        <MarkAsDoneDialog
          request={selectedRequest}
          isOpen={isMarkAsDoneDialogOpen}
          onOpenChange={setIsMarkAsDoneDialogOpen}
          onSuccess={handleMarkAsDoneSuccess}
        />
      )}
    </div>
  )
}