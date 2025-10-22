"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { CheckCircle, XCircle, MessageSquare, Send, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ApprovalStatus } from "@prisma/client"
import { processRecommendingApproval, processFinalApproval } from "@/lib/actions/material-request-actions"
import { PendingApproval, ApprovalAction } from "@/types/approval-types"

interface ApprovalDialogProps {
  approval: PendingApproval
  approvalType: "recommending" | "final"
  action: ApprovalStatus
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ApprovalDialog({ 
  approval, 
  approvalType, 
  action, 
  isOpen, 
  onOpenChange, 
  onSuccess 
}: ApprovalDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  const form = useForm<ApprovalAction>({
    defaultValues: {
      requestId: approval.id,
      status: action,
      remarks: "",
    },
  })

  const onSubmit = async (data: ApprovalAction) => {
    setIsLoading(true)
    try {
      const result = approvalType === "recommending" 
        ? await processRecommendingApproval(data)
        : await processFinalApproval(data)

      if (result.success) {
        // Show posting animation for final approval
        if (approvalType === "final" && data.status === ApprovalStatus.APPROVED && result.data?.autoPosted) {
          setIsLoading(false)
          setIsPosting(true)
          
          // Show posting animation for 2 seconds
          setTimeout(() => {
            setIsPosting(false)
            toast.success(result.message)
            form.reset()
            onOpenChange(false)
            onSuccess()
          }, 2000)
        } else {
          toast.success(result.message)
          form.reset()
          onOpenChange(false)
          onSuccess()
        }
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error processing approval:", error)
      toast.error("Failed to process approval")
    } finally {
      if (!isPosting) {
        setIsLoading(false)
      }
    }
  }

  const isApproval = action === ApprovalStatus.APPROVED
  const actionText = isApproval ? "Approve" : "Disapprove"
  const actionColor = isApproval ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
  const ActionIcon = isApproval ? CheckCircle : XCircle

  // Show posting animation overlay
  if (isPosting) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin">
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Send className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-blue-900">Request Approved!</h3>
              <p className="text-sm text-blue-700">Automatically posting request...</p>
              <div className="flex items-center justify-center space-x-2 text-xs text-blue-600">
                <Package className="w-4 h-4" />
                <span>Moving to Posted Requests</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-h-[90vh] max-h-[95vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActionIcon className={`h-5 w-5 ${isApproval ? 'text-green-600' : 'text-red-600'}`} />
            {actionText} Material Request
          </DialogTitle>
          <DialogDescription>
            You are about to {actionText.toLowerCase()} material request "{approval.docNo}". 
            {!isApproval && " Please provide a reason for disapproval."}
          </DialogDescription>
        </DialogHeader>

        {/* Request Summary */}
        <div className="space-y-3 py-3 border-y">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Request No:</span>
              <div className="text-muted-foreground">{approval.docNo}</div>
            </div>
            <div>
              <span className="font-medium">Type:</span>
              <div className="text-muted-foreground">
                <Badge variant="outline">{approval.type}</Badge>
              </div>
            </div>
            <div>
              <span className="font-medium">Requested By:</span>
              <div className="text-muted-foreground">
                {approval.requestedBy.firstName} {approval.requestedBy.lastName}
              </div>
            </div>
            <div>
              <span className="font-medium">Department:</span>
              <div className="text-muted-foreground">
                {approval.department?.name || "No Department"}
              </div>
            </div>
            <div>
              <span className="font-medium">Business Unit:</span>
              <div className="text-muted-foreground">{approval.businessUnit.name}</div>
            </div>
            <div>
              <span className="font-medium">Total Amount:</span>
              <div className="text-muted-foreground font-medium">
                ₱{approval.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {approval.purpose && (
            <div>
              <span className="font-medium text-sm">Purpose:</span>
              <div className="text-sm text-muted-foreground mt-1">{approval.purpose}</div>
            </div>
          )}

          <div>
            <span className="font-medium text-sm">Items ({approval.items.length}):</span>
            {/* Desktop Table View */}
            <div className="mt-2 rounded-md border overflow-hidden hidden sm:block">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-2 py-1.5 font-medium">Item Code</th>
                    <th className="text-left px-2 py-1.5 font-medium">Description</th>
                    <th className="text-left px-2 py-1.5 font-medium">UOM</th>
                    <th className="text-center px-2 py-1.5 font-medium">Qty</th>
                    <th className="text-right px-2 py-1.5 font-medium">Unit Price</th>
                    <th className="text-right px-2 py-1.5 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {approval.items.slice(0, 6).map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="px-2 py-1.5 font-medium">
                        {item.itemCode || (
                          <span className="text-muted-foreground italic">New Item</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="truncate max-w-[200px]" title={item.description}>
                          {item.description}
                        </div>
                        {item.remarks && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 italic truncate" title={item.remarks}>
                            {item.remarks}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        {item.uom}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {item.quantity}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        {item.unitPrice ? (
                          `₱${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium">
                        {item.unitPrice ? (
                          `₱${(item.unitPrice * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {approval.items.length > 6 && (
                <div className="bg-muted/30 px-2 py-1.5 text-center text-muted-foreground text-xs border-t">
                  + {approval.items.length - 6} more items
                </div>
              )}
            </div>

            {/* Mobile Simple List */}
            <div className="mt-2 sm:hidden">
              <div className="rounded-md border divide-y">
                {approval.items.slice(0, 3).map((item, index) => (
                  <div key={item.id} className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium text-sm truncate flex-1 mr-2">
                        {item.description}
                      </div>
                      {item.unitPrice && (
                        <div className="font-medium text-sm text-right">
                          ₱{(item.unitPrice * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>
                        {item.itemCode || "New Item"} • {item.quantity} {item.uom}
                      </span>
                      {item.unitPrice && (
                        <span>₱{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} each</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {approval.items.length > 3 && (
                <div className="text-center text-muted-foreground text-xs py-2">
                  + {approval.items.length - 3} more items
                </div>
              )}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {isApproval ? "Approval Notes (Optional)" : "Reason for Disapproval *"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        isApproval 
                          ? "Add any notes or conditions for this approval..."
                          : "Please explain why this request is being disapproved..."
                      }
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {isApproval 
                      ? "Optional notes that will be visible to the requester and other approvers."
                      : "This reason will be sent to the requester and is required for disapprovals."
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isPosting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || isPosting}
                className={`${actionColor} w-full sm:w-auto`}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ActionIcon className="mr-2 h-4 w-4" />
                    {actionText} Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}