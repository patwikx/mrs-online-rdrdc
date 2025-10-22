"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Plus, Building, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createBusinessUnit, updateBusinessUnit } from "@/lib/actions/business-unit-actions"
import { CreateBusinessUnitFormData, UpdateBusinessUnitFormData, BusinessUnit } from "@/types/admin-types"

interface BusinessUnitDialogProps {
  businessUnit?: BusinessUnit
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function BusinessUnitDialog({ 
  businessUnit, 
  onSuccess,
  trigger
}: BusinessUnitDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!businessUnit

  const form = useForm<CreateBusinessUnitFormData | UpdateBusinessUnitFormData>({
    defaultValues: isEditing ? {
      id: businessUnit.id,
      code: businessUnit.code,
      name: businessUnit.name,
      description: businessUnit.description || "",
      isActive: businessUnit.isActive,
    } : {
      code: "",
      name: "",
      description: "",
    },
  })

  // Reset form when dialog opens/closes or businessUnit changes
  useEffect(() => {
    if (isOpen) {
      if (isEditing && businessUnit) {
        form.reset({
          id: businessUnit.id,
          code: businessUnit.code,
          name: businessUnit.name,
          description: businessUnit.description || "",
          isActive: businessUnit.isActive,
        })
      } else {
        form.reset({
          code: "",
          name: "",
          description: "",
        })
      }
    }
  }, [isOpen, isEditing, businessUnit, form])

  const onSubmit = async (data: CreateBusinessUnitFormData | UpdateBusinessUnitFormData) => {
    setIsLoading(true)
    try {
      const result = isEditing 
        ? await updateBusinessUnit(data as UpdateBusinessUnitFormData)
        : await createBusinessUnit(data as CreateBusinessUnitFormData)

      if (result.success) {
        toast.success(result.message)
        form.reset()
        setIsOpen(false)
        onSuccess()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error saving business unit:", error)
      toast.error("Failed to save business unit")
    } finally {
      setIsLoading(false)
    }
  }

  const defaultTrigger = (
    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
      <Plus className="h-4 w-4" />
      Create Business Unit
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
            <Building className="h-5 w-5 text-blue-600" />
            {isEditing ? "Edit Business Unit" : "Create Business Unit"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the business unit information. Changes will affect all associated departments and users."
              : "Create a new business unit to organize departments and manage material requests."
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Code *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., BU001" 
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
                      <Input placeholder="e.g., Operations" {...field} />
                    </FormControl>
                    <FormDescription>
                      Display name for the business unit
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
                      placeholder="Brief description of the business unit's purpose and scope..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to help users understand the business unit&apos;s role
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
                        Inactive business units cannot create new requests or be assigned to users
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
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Building className="mr-2 h-4 w-4" />
                    {isEditing ? "Update Business Unit" : "Create Business Unit"}
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