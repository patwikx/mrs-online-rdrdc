"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Plus, Users, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createDepartment, updateDepartment } from "@/lib/actions/department-actions"
import { CreateDepartmentFormData, UpdateDepartmentFormData, Department, BusinessUnit } from "@/types/admin-types"

interface DepartmentDialogProps {
  department?: Department
  businessUnits: BusinessUnit[]
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function DepartmentDialog({ 
  department, 
  businessUnits,
  onSuccess,
  trigger
}: DepartmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!department

  const form = useForm<CreateDepartmentFormData | UpdateDepartmentFormData>({
    defaultValues: isEditing ? {
      id: department.id,
      code: department.code,
      name: department.name,
      description: department.description || "",
      businessUnitId: department.businessUnitId,
      isActive: department.isActive,
    } : {
      code: "",
      name: "",
      description: "",
      businessUnitId: "",
    },
  })

  // Reset form when dialog opens/closes or department changes
  useEffect(() => {
    if (isOpen) {
      if (isEditing && department) {
        form.reset({
          id: department.id,
          code: department.code,
          name: department.name,
          description: department.description || "",
          businessUnitId: department.businessUnitId,
          isActive: department.isActive,
        })
      } else {
        form.reset({
          code: "",
          name: "",
          description: "",
          businessUnitId: "",
        })
      }
    }
  }, [isOpen, isEditing, department, form])

  const onSubmit = async (data: CreateDepartmentFormData | UpdateDepartmentFormData) => {
    setIsLoading(true)
    try {
      const result = isEditing 
        ? await updateDepartment(data as UpdateDepartmentFormData)
        : await createDepartment(data as CreateDepartmentFormData)

      if (result.success) {
        toast.success(result.message)
        form.reset()
        setIsOpen(false)
        onSuccess()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error saving department:", error)
      toast.error("Failed to save department")
    } finally {
      setIsLoading(false)
    }
  }

  const defaultTrigger = (
    <Button className="gap-2 bg-green-600 hover:bg-green-700">
      <Plus className="h-4 w-4" />
      Create Department
    </Button>
  )

  const editTrigger = (
    <Button variant="ghost" size="sm" className="gap-2">
      <Edit className="h-4 w-4" />
      Edit
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (isEditing ? editTrigger : defaultTrigger)}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            {isEditing ? "Edit Department" : "Create Department"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the department information. Changes will affect all associated users and approvers."
              : "Create a new department within a business unit to organize users and manage approvals."
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="businessUnitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Business Unit *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a business unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {businessUnits.filter(bu => bu.isActive).map((businessUnit) => (
                        <SelectItem key={businessUnit.id} value={businessUnit.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{businessUnit.name}</span>
                            <span className="text-xs text-muted-foreground">{businessUnit.code}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the business unit this department belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Code *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., IT001" 
                        {...field} 
                        className="uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique identifier (max 10 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., IT Department" {...field} />
                    </FormControl>
                    <FormDescription>
                      Display name for the department
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the department's responsibilities and scope..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to help users understand the department&apos;s role
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">Active Status</FormLabel>
                      <FormDescription>
                        Inactive departments cannot be assigned to users or create new requests
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    {isEditing ? "Update Department" : "Create Department"}
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