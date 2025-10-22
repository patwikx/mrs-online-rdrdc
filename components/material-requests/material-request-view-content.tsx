"use client"

import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MaterialRequest } from "@/types/material-request-types"

interface MaterialRequestViewContentProps {
  materialRequest: MaterialRequest
}

export function MaterialRequestViewContent({ materialRequest }: MaterialRequestViewContentProps) {
  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            <div>
              <label className="text-sm font-medium text-muted-foreground">Business Unit</label>
              <p className="mt-1 font-medium">{materialRequest.businessUnit.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Department</label>
              <p className="mt-1 font-medium">
                {materialRequest.department?.name || "No Department"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Requested By</label>
              <p className="mt-1 font-medium">
                {materialRequest.requestedBy.firstName} {materialRequest.requestedBy.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date Prepared</label>
              <p className="mt-1 font-medium">
                {format(new Date(materialRequest.datePrepared), "PPP")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date Required</label>
              <p className="mt-1 font-medium">
                {format(new Date(materialRequest.dateRequired), "PPP")}
              </p>
            </div>
            {materialRequest.chargeTo && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Charge To</label>
                <p className="mt-1 font-medium">{materialRequest.chargeTo}</p>
              </div>
            )}
          </div>

          {(materialRequest.purpose || materialRequest.deliverTo || materialRequest.remarks) && (
            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
              {materialRequest.remarks && (
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                  <p className="mt-1">{materialRequest.remarks}</p>
                </div>
              )}
            </div>
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
                            <div className="font-medium text-sm">₱{(item.unitPrice || 0).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Total</div>
                            <div className="font-semibold text-sm">₱{itemTotal.toLocaleString()}</div>
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
            <div className="rounded-lg border border-border bg-card overflow-x-auto ml-4 mr-4">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      #
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Item Code
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Description
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      UOM
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Quantity
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Unit Price
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Total
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Type
                    </TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {materialRequest.items.map((item, index) => {
                  const itemTotal = (item.unitPrice || 0) * item.quantity
                  return (
                    <TableRow 
                      key={item.id} 
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="h-14 px-4 align-middle">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <div className="font-medium">
                          {item.itemCode || (
                            <span className="text-muted-foreground italic">Auto-generated</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <div className="max-w-[200px]">
                          <div className="font-medium">{item.description}</div>
                          {item.remarks && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.remarks}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <span className="font-medium">{item.uom}</span>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <span className="font-medium">{item.quantity}</span>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <span className="font-medium">₱{(item.unitPrice || 0).toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <span className="font-semibold">₱{itemTotal.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="h-14 px-4 align-middle">
                        <Badge 
                          variant={item.itemCode ? "secondary" : "default"}
                          className="font-medium"
                        >
                          {item.itemCode ? "Existing" : "New"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Freight</label>
              <p className="mt-1 font-medium">₱{materialRequest.freight.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Discount</label>
              <p className="mt-1 font-medium">₱{materialRequest.discount.toLocaleString()}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
              <p className="mt-1 text-lg sm:text-xl font-bold">₱{materialRequest.total.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Information */}
      {(materialRequest.recApprover || materialRequest.finalApprover) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Approval Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {materialRequest.recApprover && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Recommending Approver</label>
                  <p className="mt-1 font-medium">
                    {materialRequest.recApprover.firstName} {materialRequest.recApprover.lastName}
                  </p>
                  {materialRequest.recApprovalDate && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(materialRequest.recApprovalDate), "PPP")}
                    </p>
                  )}
                </div>
              )}
              {materialRequest.finalApprover && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Final Approver</label>
                  <p className="mt-1 font-medium">
                    {materialRequest.finalApprover.firstName} {materialRequest.finalApprover.lastName}
                  </p>
                  {materialRequest.finalApprovalDate && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(materialRequest.finalApprovalDate), "PPP")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}