"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileText, Package, CheckCircle, Building, Users, Calendar, Clock, User, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { MaterialRequest, REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from "@/types/material-request-types"
import { RequestStatus } from "@prisma/client"
import { markAsPosted, markAsReceived } from "@/lib/actions/material-request-actions"
import { format } from "date-fns"

interface ApprovedRequestDetailPageProps {
  materialRequest: MaterialRequest
  businessUnitId: string
  userRole: string
}

export function ApprovedRequestDetailPage({ 
  materialRequest: initialRequest, 
  businessUnitId, 
  userRole 
}: ApprovedRequestDetailPageProps) {
  const router = useRouter()
  const [materialRequest, setMaterialRequest] = useState(initialRequest)
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false)
  const [confirmationNo, setConfirmationNo] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
    return format(new Date(date), "MMMM dd, yyyy 'at' h:mm a")
  }

  const formatDateShort = (date: Date | null) => {
    if (!date) return "N/A"
    return format(new Date(date), "MMM dd, yyyy")
  }

  const handlePost = async () => {
    setIsLoading(true)
    try {
      const result = await markAsPosted(materialRequest.id, confirmationNo || undefined)
      if (result.success) {
        setMaterialRequest(prev => ({
          ...prev,
          status: RequestStatus.POSTED,
          datePosted: new Date(),
          confirmationNo: confirmationNo || null
        }))
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to post request")
    } finally {
      setIsLoading(false)
      setIsPostDialogOpen(false)
      setConfirmationNo("")
    }
  }

  const handleReceive = async () => {
    setIsLoading(true)
    try {
      const result = await markAsReceived(materialRequest.id)
      if (result.success) {
        setMaterialRequest(prev => ({
          ...prev,
          status: RequestStatus.RECEIVED,
          dateReceived: new Date()
        }))
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to receive request")
    } finally {
      setIsLoading(false)
      setIsReceiveDialogOpen(false)
    }
  }

  const canPost = () => {
    return materialRequest.status === RequestStatus.FINAL_APPROVED && 
           ["ADMIN", "MANAGER", "PURCHASER"].includes(userRole)
  }

  const canReceive = () => {
    return materialRequest.status === RequestStatus.POSTED && 
           ["ADMIN", "MANAGER", "PURCHASER", "STOCKROOM"].includes(userRole)
  }

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.FINAL_APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case RequestStatus.POSTED:
        return <FileText className="h-5 w-5 text-blue-600" />
      case RequestStatus.RECEIVED:
        return <Package className="h-5 w-5 text-teal-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              {getStatusIcon(materialRequest.status)}
              <h1 className="text-xl sm:text-2xl font-bold">{materialRequest.docNo}</h1>
              <Badge className={REQUEST_STATUS_COLORS[materialRequest.status]}>
                {REQUEST_STATUS_LABELS[materialRequest.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Material Request Details
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {canPost() && (
            <Button
              onClick={() => setIsPostDialogOpen(true)}
              disabled={isLoading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Mark as Posted
            </Button>
          )}
          
          {canReceive() && (
            <Button
              onClick={() => setIsReceiveDialogOpen(true)}
              disabled={isLoading}
            >
              <Package className="h-4 w-4 mr-2" />
              Mark as Received
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Request Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Document No.</label>
                    <p className="mt-1 font-medium">{materialRequest.docNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Series</label>
                    <p className="mt-1 font-medium">{materialRequest.series}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Request Type</label>
                    <p className="mt-1 font-medium">
                      {materialRequest.type === "ITEM" ? "Item" : "Service"}
                    </p>
                  </div>
                  {materialRequest.confirmationNo && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Confirmation No.</label>
                      <p className="mt-1 font-medium">{materialRequest.confirmationNo}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date Prepared</label>
                    <p className="mt-1 font-medium">{formatDateShort(materialRequest.datePrepared)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date Required</label>
                    <p className="mt-1 font-medium">{formatDateShort(materialRequest.dateRequired)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date Approved</label>
                    <p className="mt-1 font-medium">{formatDateShort(materialRequest.dateApproved)}</p>
                  </div>
                  {materialRequest.datePosted && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date Posted</label>
                      <p className="mt-1 font-medium">{formatDateShort(materialRequest.datePosted)}</p>
                    </div>
                  )}
                  {materialRequest.dateReceived && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date Received</label>
                      <p className="mt-1 font-medium">{formatDateShort(materialRequest.dateReceived)}</p>
                    </div>
                  )}
                </div>
              </div>

              {(materialRequest.purpose || materialRequest.deliverTo || materialRequest.chargeTo) && (
                <>
                  <div className="border-t my-6" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {materialRequest.purpose && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                        <p className="mt-1">{materialRequest.purpose}</p>
                      </div>
                    )}
                    {materialRequest.deliverTo && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Deliver To</label>
                        <p className="mt-1">{materialRequest.deliverTo}</p>
                      </div>
                    )}
                    {materialRequest.chargeTo && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Charge To</label>
                        <p className="mt-1">{materialRequest.chargeTo}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {materialRequest.remarks && (
                <>
                  <div className="border-t my-6" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                    <p className="mt-1">{materialRequest.remarks}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Items ({materialRequest.items.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile Card View */}
              <div className="block sm:hidden">
                <div className="space-y-3 p-4">
                  {materialRequest.items.map((item, index) => {
                    const itemTotal = (item.unitPrice || 0) * item.quantity
                    return (
                      <div key={item.id} className="border rounded-lg p-3 space-y-3 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                              {index + 1}
                            </div>
                            <Badge 
                              variant={item.itemCode ? "secondary" : "default"}
                              className="font-medium text-xs"
                            >
                              {item.itemCode ? "Existing" : "New"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-muted-foreground">Item Code</div>
                            <div className="font-medium text-sm">
                              {item.itemCode || (
                                <span className="text-muted-foreground italic">Auto-generated</span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-muted-foreground">Description</div>
                            <div className="font-medium text-sm">{item.description}</div>
                            {item.remarks && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {item.remarks}
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground">UOM</div>
                              <div className="font-medium text-sm">{item.uom}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Quantity</div>
                              <div className="font-medium text-sm">{item.quantity}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground">Unit Price</div>
                              <div className="font-medium text-sm">{formatCurrency(item.unitPrice || 0)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Total</div>
                              <div className="font-semibold text-sm">{formatCurrency(itemTotal)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-hidden">
                <div className="rounded-lg border border-border bg-card overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b border-border">
                        <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">#</th>
                        <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">Item Code</th>
                        <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">Description</th>
                        <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">UOM</th>
                        <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">Quantity</th>
                        <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">Unit Price</th>
                        <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">Total</th>
                        <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materialRequest.items.map((item, index) => {
                        const itemTotal = (item.unitPrice || 0) * item.quantity
                        return (
                          <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="h-14 px-4 align-middle">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                                {index + 1}
                              </div>
                            </td>
                            <td className="h-14 px-4 align-middle">
                              <div className="font-medium">
                                {item.itemCode || (
                                  <span className="text-muted-foreground italic">Auto-generated</span>
                                )}
                              </div>
                            </td>
                            <td className="h-14 px-4 align-middle">
                              <div className="max-w-[200px]">
                                <div className="font-medium">{item.description}</div>
                                {item.remarks && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {item.remarks}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="h-14 px-4 align-middle">
                              <span className="font-medium">{item.uom}</span>
                            </td>
                            <td className="h-14 px-4 align-middle">
                              <span className="font-medium">{item.quantity}</span>
                            </td>
                            <td className="h-14 px-4 align-middle">
                              <span className="font-medium">{formatCurrency(item.unitPrice || 0)}</span>
                            </td>
                            <td className="h-14 px-4 align-middle">
                              <span className="font-semibold">{formatCurrency(itemTotal)}</span>
                            </td>
                            <td className="h-14 px-4 align-middle">
                              <Badge 
                                variant={item.itemCode ? "secondary" : "default"}
                                className="font-medium"
                              >
                                {item.itemCode ? "Existing" : "New"}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Freight:</span>
                <span className="font-medium">{formatCurrency(materialRequest.freight)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Discount:</span>
                <span className="font-medium">{formatCurrency(materialRequest.discount)}</span>
              </div>
              <div className="border-t pt-4" />
              <div className="flex justify-between">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-bold">{formatCurrency(materialRequest.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {materialRequest.requestedBy.firstName} {materialRequest.requestedBy.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{materialRequest.requestedBy.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{materialRequest.businessUnit.name}</p>
                  <p className="text-xs text-muted-foreground">Business Unit</p>
                </div>
              </div>
              
              {materialRequest.department && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{materialRequest.department.name}</p>
                    <p className="text-xs text-muted-foreground">Department</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{formatDateShort(materialRequest.dateRequired)}</p>
                  <p className="text-xs text-muted-foreground">Required Date</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval History */}
          {(materialRequest.recApprover || materialRequest.finalApprover) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Approval History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {materialRequest.recApprover && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Recommending Approval</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <p className="text-sm">
                        {materialRequest.recApprover.firstName} {materialRequest.recApprover.lastName}
                      </p>
                      {materialRequest.recApprovalDate && (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(materialRequest.recApprovalDate)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {materialRequest.finalApprover && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Final Approval</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <p className="text-sm">
                        {materialRequest.finalApprover.firstName} {materialRequest.finalApprover.lastName}
                      </p>
                      {materialRequest.finalApprovalDate && (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(materialRequest.finalApprovalDate)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Post Confirmation Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Posted</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to mark "{materialRequest.docNo}" as posted?
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
              Are you sure you want to mark "{materialRequest.docNo}" as received?
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