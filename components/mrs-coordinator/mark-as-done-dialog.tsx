"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Check, ChevronsUpDown, Package, Building, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { markAsReceived } from "@/lib/actions/material-request-actions"
import { Input } from "../ui/input"

interface Supplier {
  cardCode: string
  cardName: string
}

interface MaterialRequest {
  id: string
  docNo: string
  type: string
  total: number
  requestedBy: {
    firstName: string
    lastName: string
  }
  businessUnit: {
    name: string
  }
  department: {
    name: string
  } | null
}

interface MarkAsDoneFormData {
  supplierBPCode?: string
  supplierName?: string
  purchaseOrderNumber?: string
}

interface MarkAsDoneDialogProps {
  request: MaterialRequest
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function MarkAsDoneDialog({ 
  request, 
  isOpen, 
  onOpenChange, 
  onSuccess 
}: MarkAsDoneDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("")
  const [isSupplierPopoverOpen, setIsSupplierPopoverOpen] = useState(false)

  const form = useForm<MarkAsDoneFormData>({
    defaultValues: {
      supplierBPCode: "",
      supplierName: "",
      purchaseOrderNumber: "",
    },
  })

  const selectedSupplier = form.watch("supplierBPCode")

  // Fetch suppliers when popover opens or search term changes
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!isSupplierPopoverOpen && !supplierSearchTerm) return
      
      setIsLoadingSuppliers(true)
      try {
        const searchParam = supplierSearchTerm ? `?search=${encodeURIComponent(supplierSearchTerm)}` : ""
        const response = await fetch(`/api/suppliers${searchParam}`)
        const data = await response.json()
        
        if (data.success) {
          setSuppliers(data.data)
        } else {
          toast.error("Failed to load suppliers")
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error)
        toast.error("Failed to load suppliers")
      } finally {
        setIsLoadingSuppliers(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuppliers, 300)
    return () => clearTimeout(debounceTimer)
  }, [supplierSearchTerm, isSupplierPopoverOpen])

  const onSubmit = async (data: MarkAsDoneFormData) => {
    // Validate required fields
    if (!data.supplierBPCode || data.supplierBPCode.trim() === "") {
      toast.error("Supplier is required")
      return
    }

    if (!data.purchaseOrderNumber || data.purchaseOrderNumber.trim() === "") {
      toast.error("Purchase Order Number is required")
      return
    }

    setIsLoading(true)
    try {
      const result = await markAsReceived(
        request.id, 
        data.supplierBPCode, 
        data.supplierName,
        data.purchaseOrderNumber
      )

      if (result.success) {
        toast.success(result.message)
        form.reset()
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error marking as done:", error)
      toast.error("Failed to mark request as done")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSupplierSelect = (supplier: Supplier) => {
    form.setValue("supplierBPCode", supplier.cardCode)
    form.setValue("supplierName", supplier.cardName)
    setIsSupplierPopoverOpen(false)
    setSupplierSearchTerm("")
  }

  const clearSupplier = () => {
    form.setValue("supplierBPCode", "")
    form.setValue("supplierName", "")
  }

  const getSelectedSupplierDisplay = () => {
    const bpCode = form.getValues("supplierBPCode")
    const name = form.getValues("supplierName")
    if (bpCode && name) {
      return `${bpCode} - ${name}`
    }
    return "Select supplier"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Mark Request as Done
          </DialogTitle>
          <DialogDescription>
            Mark material request "{request.docNo}" as completed and received.
            You can optionally select a supplier for this request.
          </DialogDescription>
        </DialogHeader>

        {/* Request Summary */}
        <div className="space-y-3 py-3 border-y">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Request No:</span>
              <div className="text-muted-foreground">{request.docNo}</div>
            </div>
            <div>
              <span className="font-medium">Type:</span>
              <div className="text-muted-foreground">
                <Badge variant="outline">{request.type}</Badge>
              </div>
            </div>
            <div>
              <span className="font-medium">Requested By:</span>
              <div className="text-muted-foreground">
                {request.requestedBy.firstName} {request.requestedBy.lastName}
              </div>
            </div>
            <div>
              <span className="font-medium">Department:</span>
              <div className="text-muted-foreground">
                {request.department?.name || "No Department"}
              </div>
            </div>
            <div>
              <span className="font-medium">Business Unit:</span>
              <div className="text-muted-foreground">{request.businessUnit.name}</div>
            </div>
            <div>
              <span className="font-medium">Total Amount:</span>
              <div className="text-muted-foreground font-medium">
                ₱{request.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="supplierBPCode"
              rules={{
                required: "Supplier is required"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Supplier <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover open={isSupplierPopoverOpen} onOpenChange={setIsSupplierPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isSupplierPopoverOpen}
                          className="w-full justify-between"
                        >
                          <span className="truncate">
                            {getSelectedSupplierDisplay()}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search suppliers..." 
                          value={supplierSearchTerm}
                          onValueChange={setSupplierSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingSuppliers ? "Loading suppliers..." : "No suppliers found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {selectedSupplier && (
                              <CommandItem
                                onSelect={clearSupplier}
                                className="text-muted-foreground"
                              >
                                <Check className="mr-2 h-4 w-4 opacity-0" />
                                Clear selection
                              </CommandItem>
                            )}
                            {suppliers.map((supplier) => (
                              <CommandItem
                                key={supplier.cardCode}
                                onSelect={() => handleSupplierSelect(supplier)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSupplier === supplier.cardCode ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">BP Code: {supplier.cardCode}</span>
                                  <span className="text-sm text-muted-foreground">
                                    Supplier: {supplier.cardName}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedSupplier && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span className="font-medium">Selected Supplier</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  <div><strong>BP Code:</strong> {form.getValues("supplierBPCode")}</div>
                  <div><strong>Supplier:</strong> {form.getValues("supplierName")}</div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="purchaseOrderNumber"
              rules={{
                required: "Purchase Order Number is required",
                minLength: {
                  value: 1,
                  message: "Purchase Order Number cannot be empty"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Purchase Order Number <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter PO number from SAP"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Mark as Done
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