"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { CalendarIcon, Plus, Trash2, Send } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { RequestStatus } from "@prisma/client"
import { createMaterialRequest, submitForApproval, getNextDocumentNumber } from "@/lib/actions/material-request-actions"
import { getBusinessUnits, getDepartments } from "@/lib/actions/user-actions"
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from "@/types/material-request-types"

interface MaterialRequestItem {
  itemCode?: string
  description: string
  uom: string
  quantity: number
  unitPrice?: number
  remarks?: string
  isNew: boolean
}

interface MaterialRequestFormData {
  docNo: string
  series: "PO" | "JO"
  type: "ITEM" | "SERVICE"
  status: "DRAFT"
  datePrepared: Date
  dateRequired: Date
  businessUnitId: string
  departmentId?: string
  chargeTo?: string
  purpose?: string
  remarks?: string
  deliverTo?: string
  freight: number
  discount: number
  items: MaterialRequestItem[]
}

export function MaterialRequestCreateForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [businessUnits, setBusinessUnits] = useState<Array<{ id: string; name: string; code: string }>>([])
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; code: string; businessUnitId: string }>>([])
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [, setNextDocNumber] = useState("")

  const form = useForm<MaterialRequestFormData>({
    defaultValues: {
      docNo: "",
      series: "PO",
      type: "ITEM",
      status: "DRAFT",
      datePrepared: new Date(),
      dateRequired: new Date(),
      businessUnitId: session?.user?.activeBusinessUnit?.id || "",
      departmentId: session?.user?.mrsUserDepartment?.id || "",
      chargeTo: session?.user?.mrsUserDepartment?.name || "",
      purpose: "",
      remarks: "",
      deliverTo: "",
      freight: 0,
      discount: 0,
      items: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedBusinessUnitId = form.watch("businessUnitId")
  const watchedDepartmentId = form.watch("departmentId")
  const watchedItems = form.watch("items")
  const watchedFreight = form.watch("freight")
  const watchedDiscount = form.watch("discount")
  const watchedSeries = form.watch("series")
  const watchedStatus = form.watch("status")

  // Update document number when series changes
  useEffect(() => {
    const updateDocNumber = async () => {
      try {
        const newDocNo = await getNextDocumentNumber(watchedSeries)
        setNextDocNumber(newDocNo)
        form.setValue("docNo", newDocNo)
      } catch (error) {
        console.error("Error getting next document number:", error)
      }
    }
    updateDocNumber()
  }, [watchedSeries, form])

  // Calculate total
  const total = watchedItems.reduce((sum, item) => {
    const itemTotal = (item.unitPrice || 0) * (item.quantity || 0)
    return sum + itemTotal
  }, 0) + (watchedFreight || 0) - (watchedDiscount || 0)

  useEffect(() => {
    const loadData = async () => {
      const [businessUnitsData, departmentsData, initialDocNo] = await Promise.all([
        getBusinessUnits(),
        getDepartments(),
        getNextDocumentNumber("PO")
      ])
      setBusinessUnits(businessUnitsData)
      setDepartments(departmentsData)
      setNextDocNumber(initialDocNo)
      form.setValue("docNo", initialDocNo)
    }
    loadData()
  }, [])

  const filteredDepartments = departments.filter(
    dept => dept.businessUnitId === watchedBusinessUnitId
  )

  // Auto-populate charge to when department changes
  useEffect(() => {
    if (watchedDepartmentId) {
      const selectedDepartment = departments.find(dept => dept.id === watchedDepartmentId)
      if (selectedDepartment) {
        form.setValue("chargeTo", selectedDepartment.name)
      }
    } else {
      form.setValue("chargeTo", "")
    }
  }, [watchedDepartmentId, departments, form])

  const onSubmit = async (data: MaterialRequestFormData) => {
    if (data.items.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    if (!data.departmentId) {
      toast.error("Please select a department")
      return
    }

    if (!data.chargeTo || data.chargeTo.trim() === "") {
      toast.error("Please enter charge to")
      return
    }

    // Debug: Log the data being submitted
    console.log("Submitting data:", JSON.stringify(data, null, 2))

    setIsLoading(true)
    try {
      const result = await createMaterialRequest(data)

      if (result.success) {
        toast.success("Material request saved as draft successfully")
        router.push("../material-requests")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      if (error instanceof Error) {
        toast.error(error.message || "Failed to create material request")
      } else {
        toast.error("Failed to create material request")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitForApproval = async () => {
    const formData = form.getValues()
    
    if (formData.items.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    if (!formData.departmentId) {
      toast.error("Please select a department")
      return
    }

    if (!formData.chargeTo || formData.chargeTo.trim() === "") {
      toast.error("Please enter charge to")
      return
    }

    setIsLoading(true)
    try {
      // First create the request as draft
      const createResult = await createMaterialRequest(formData)

      if (createResult.success && createResult.data) {
        // Then submit for approval
        const submitResult = await submitForApproval((createResult.data as { id: string }).id)
        
        if (submitResult.success) {
          toast.success("Material request submitted for approval successfully")
          router.push("../material-requests")
        } else {
          toast.error(submitResult.message)
        }
      } else {
        toast.error(createResult.message)
      }
    } catch (error) {
      console.error("Error submitting for approval:", error)
      toast.error("Failed to submit material request for approval")
    } finally {
      setIsLoading(false)
    }
  }

  // Add Item Dialog Form
  const addItemForm = useForm<MaterialRequestItem>({
    defaultValues: {
      itemCode: "",
      description: "",
      uom: "",
      quantity: 1,
      unitPrice: 0,
      remarks: "",
      isNew: true,
    },
    mode: "onChange", // Enable real-time validation
  })

  const watchedIsNew = addItemForm.watch("isNew")

  const addItem = (data: MaterialRequestItem) => {
    console.log("Adding item:", data) // Debug log
    
    if (!data.isNew && !data.itemCode) {
      toast.error("Item code is required for existing items")
      return
    }
    
    if (!data.description || data.description.trim() === "") {
      toast.error("Description is required")
      return
    }
    
    if (!data.uom || data.uom.trim() === "") {
      toast.error("Unit of measurement is required")
      return
    }
    
    if (!data.quantity || data.quantity <= 0) {
      toast.error("Quantity must be greater than 0")
      return
    }
    
    append(data)
    addItemForm.reset({
      itemCode: "",
      description: "",
      uom: "",
      quantity: 1,
      unitPrice: 0,
      remarks: "",
      isNew: true,
    })
    setIsAddItemDialogOpen(false)
    toast.success("Item added successfully")
  }

  return (
    <div className="w-full max-w-none px-2 sm:px-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Header with Cancel and Create buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge 
                variant="secondary" 
                className={REQUEST_STATUS_COLORS[watchedStatus as RequestStatus]}
              >
                {REQUEST_STATUS_LABELS[watchedStatus as RequestStatus]}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? "Saving..." : "Draft"}
              </Button>
              <Button 
                type="button" 
                onClick={handleSubmitForApproval}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 gap-2 w-full sm:w-auto"
              >
                <Send className="h-4 w-4" />
                {isLoading ? "Submitting..." : "Submit for Approval"}
              </Button>
            </div>
          </div>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">


                <FormField
                  control={form.control}
                  name="series"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Series <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select series" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PO">PO</SelectItem>
                          <SelectItem value="JO">JO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="docNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No.</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Type <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select request type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ITEM">Item</SelectItem>
                          <SelectItem value="SERVICE">Service</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessUnitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Unit <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                        <FormControl>
                          <SelectTrigger className="w-full bg-muted">
                            <SelectValue placeholder="Select business unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {businessUnits.map((bu) => (
                            <SelectItem key={bu.id} value={bu.id}>
                              {bu.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredDepartments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="chargeTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Charge To <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter charge to" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="datePrepared"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date Prepared <span className="text-red-500">*</span></FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date Required <span className="text-red-500">*</span></FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter purpose"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliverTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deliver To (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter delivery address"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter remarks"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-base sm:text-lg">Items</CardTitle>
                <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Item</DialogTitle>
                    </DialogHeader>
                    <Form {...addItemForm}>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={addItemForm.control}
                            name="isNew"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Item Type</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(value === "true")} 
                                  defaultValue={field.value ? "true" : "false"}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select item type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="true">New Item</SelectItem>
                                    <SelectItem value="false">Existing Item</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addItemForm.control}
                            name="itemCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Item Code {!watchedIsNew && "*"}</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter item code" 
                                    {...field} 
                                    disabled={watchedIsNew}
                                    className={watchedIsNew ? "bg-muted" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={addItemForm.control}
                            name="uom"
                            rules={{
                              required: "Unit of measurement is required",
                              minLength: {
                                value: 1,
                                message: "Unit of measurement cannot be empty"
                              }
                            }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unit of Measurement *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., pcs, kg, liter" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addItemForm.control}
                            name="quantity"
                            rules={{
                              required: "Quantity is required",
                              min: {
                                value: 0.01,
                                message: "Quantity must be greater than 0"
                              }
                            }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={addItemForm.control}
                          name="unitPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={addItemForm.control}
                          name="description"
                          rules={{
                            required: "Description is required",
                            minLength: {
                              value: 1,
                              message: "Description cannot be empty"
                            }
                          }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter item description"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={addItemForm.control}
                          name="remarks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Remarks (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter item remarks"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsAddItemDialogOpen(false)}
                            className="w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="button" 
                            onClick={addItemForm.handleSubmit(addItem)}
                            className="w-full sm:w-auto"
                          >
                            Add Item
                          </Button>
                        </DialogFooter>
                      </div>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {fields.length > 0 ? (
                <div>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden">
                    <div className="space-y-3 p-4">
                      {fields.map((field, index) => {
                        const item = watchedItems[index]
                        const itemTotal = (item?.unitPrice || 0) * (item?.quantity || 0)
                        return (
                          <div key={field.id} className="border rounded-lg p-3 space-y-3 bg-muted/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                                  {index + 1}
                                </div>
                                <Badge 
                                  variant={item?.isNew ? "default" : "secondary"}
                                  className="font-medium text-xs"
                                >
                                  {item?.isNew ? "New" : "Existing"}
                                </Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <div className="text-xs text-muted-foreground">Item Code</div>
                                <div className="font-medium text-sm">
                                  {item?.itemCode || (
                                    <span className="text-muted-foreground italic">Auto-generated</span>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-muted-foreground">Description</div>
                                <div className="font-medium text-sm">{item?.description}</div>
                                {item?.remarks && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {item.remarks}
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-muted-foreground">UOM</div>
                                  <div className="font-medium text-sm">{item?.uom}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Quantity</div>
                                  <div className="font-medium text-sm">{item?.quantity}</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-muted-foreground">Unit Price</div>
                                  <div className="font-medium text-sm">₱{(item?.unitPrice || 0).toLocaleString()}</div>
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
                    <div className="rounded-lg border border-border bg-card overflow-x-auto">
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
                          <TableHead className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground w-[100px]">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => {
                        const item = watchedItems[index]
                        const itemTotal = (item?.unitPrice || 0) * (item?.quantity || 0)
                        return (
                          <TableRow 
                            key={field.id} 
                            className="border-b border-border hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="h-14 px-4 align-middle">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell className="h-14 px-4 align-middle">
                              <div className="font-medium">
                                {item?.itemCode || (
                                  <span className="text-muted-foreground italic">Auto-generated</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="h-14 px-4 align-middle">
                              <div className="max-w-[200px]">
                                <div className="font-medium truncate">{item?.description}</div>
                                {item?.remarks && (
                                  <div className="text-xs text-muted-foreground truncate mt-1">
                                    {item.remarks}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="h-14 px-4 align-middle">
                              <span className="font-medium">{item?.uom}</span>
                            </TableCell>
                            <TableCell className="h-14 px-4 align-middle">
                              <span className="font-medium">{item?.quantity}</span>
                            </TableCell>
                            <TableCell className="h-14 px-4 align-middle">
                              <span className="font-medium">₱{(item?.unitPrice || 0).toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="h-14 px-4 align-middle">
                              <span className="font-semibold">₱{itemTotal.toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="h-14 px-4 align-middle">
                              <Badge 
                                variant={item?.isNew ? "default" : "secondary"}
                                className="font-medium"
                              >
                                {item?.isNew ? "New" : "Existing"}
                              </Badge>
                            </TableCell>
                            <TableCell className="h-14 px-4 align-middle">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="h-6 w-6" />
                    </div>
                    <p className="font-medium">No items added yet</p>
                    <p className="text-sm">Click "Add Item" to get started</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="freight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Freight</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <div className="text-base sm:text-lg font-semibold w-full">
                    <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                    <div className="text-lg sm:text-xl">₱{total.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}