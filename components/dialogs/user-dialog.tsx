"use client"

import { useTransition, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createUser, updateUser, type CreateUserInput, type UpdateUserInput } from "@/lib/actions/user-actions"

const UserFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  contactNo: z.string().optional(),
  role: z.enum([
    "ADMIN", "MANAGER", "STAFF", "TENANT", "TREASURY", 
    "PURCHASER", "ACCTG", "VIEWER", "OWNER", "STOCKROOM", "MAINTENANCE"
  ]),
  businessUnitId: z.string().optional(),
  mrsDepartmentId: z.string().optional(),
})

type UserFormData = z.infer<typeof UserFormSchema>

interface BusinessUnit {
  id: string
  name: string
  code: string
}

interface Department {
  id: string
  name: string
  code: string
  businessUnit: {
    id: string
    name: string
    code: string
  }
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  contactNo: string | null
  role: UserRole
  mrsDepartmentId: string | null
  mrsUserDepartment: Department | null
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  departments: Department[]
  businessUnits?: BusinessUnit[]
  mode: "create" | "edit"
  onSuccess?: () => void
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  STAFF: "Staff",
  TENANT: "Tenant",
  TREASURY: "Treasury",
  PURCHASER: "Purchaser",
  ACCTG: "Accounting",
  VIEWER: "Viewer",
  OWNER: "Owner",
  STOCKROOM: "Stockroom",
  MAINTENANCE: "Maintenance",
}

export function UserDialog({ open, onOpenChange, user, departments, businessUnits = [], mode, onSuccess }: UserDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<UserFormData>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      password: "",
      contactNo: user?.contactNo || "",
      role: user?.role || "STAFF",
      businessUnitId: user?.mrsUserDepartment?.businessUnit.id || "",
      mrsDepartmentId: user?.mrsDepartmentId || "",
    },
  })

  // Watch business unit selection to filter departments
  const selectedBusinessUnitId = form.watch("businessUnitId")
  
  const filteredDepartments = useMemo(() => {
    if (!selectedBusinessUnitId || !departments) return departments || []
    return departments.filter(dept => dept.businessUnit.id === selectedBusinessUnitId)
  }, [departments, selectedBusinessUnitId])

  const onSubmit = (data: UserFormData) => {
    startTransition(async () => {
      try {
        let result

        if (mode === "create") {
          if (!data.password) {
            toast.error("Password is required for new users")
            return
          }
          
          const createData: CreateUserInput = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            contactNo: data.contactNo,
            role: data.role,
            mrsDepartmentId: data.mrsDepartmentId || undefined,
          }
          
          result = await createUser(createData)
        } else {
          if (!user?.id) {
            toast.error("User ID is required for updates")
            return
          }

          const updateData: UpdateUserInput = {
            id: user.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            contactNo: data.contactNo,
            role: data.role,
            mrsDepartmentId: data.mrsDepartmentId || undefined,
          }
          
          result = await updateUser(updateData)
        }

        if (result.success) {
          toast.success(result.message)
          form.reset()
          onOpenChange(false)
          onSuccess?.()
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        console.error("Form submission error:", error)
        toast.error("An unexpected error occurred")
      }
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isPending) {
      form.reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New User" : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Add a new user to the system with appropriate role and department assignment."
              : "Update user information, role, and department assignment."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        User's first name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        User's last name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+63 917 123 4567" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Optional phone number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Account Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Account Information</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email Address <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john.doe@company.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Used for login and notifications. Must be unique.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {mode === "create" && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Password <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter secure password" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Minimum 6 characters. User can change later.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Role & Assignment Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Role & Assignment</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        System Role <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Determines system access level
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                control={form.control}
                name="mrsDepartmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-dept">No Department</SelectItem>
                        {filteredDepartments && filteredDepartments.length > 0 ? (
                          filteredDepartments.map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                              {department.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            {selectedBusinessUnitId ? "No departments available" : "Select business unit first"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Optional department assignment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

               
              </div>
              
               <FormField
                  control={form.control}
                  name="businessUnitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Unit</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue("mrsDepartmentId", "")
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-bu">No Business Unit</SelectItem>
                          {businessUnits && businessUnits.length > 0 ? (
                            businessUnits.map((businessUnit) => (
                              <SelectItem key={businessUnit.id} value={businessUnit.id}>
                                {businessUnit.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No units available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Filters available departments
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : mode === "create" ? "Create User" : "Update User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}