"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createUser, updateUser, type CreateUserInput, type UpdateUserInput } from "@/lib/actions/user-actions"

const UserFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  contactNo: z.string().optional(),
  role: z.nativeEnum(UserRole),
  mrsDepartmentId: z.string().optional(),
})

type UserFormData = z.infer<typeof UserFormSchema>

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

interface UserFormProps {
  user?: User | null
  departments: Department[]
  mode: "create" | "edit"
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

export function UserForm({ user, departments, mode }: UserFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<UserFormData>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      password: "",
      contactNo: user?.contactNo || "",
      role: user?.role || UserRole.STAFF,
      mrsDepartmentId: user?.mrsDepartmentId || "",
    },
  })

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
          router.push("/admin/users")
          router.refresh()
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        console.error("Form submission error:", error)
        toast.error("An unexpected error occurred")
      }
    })
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Create New User" : "Edit User"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      {...field} 
                    />
                  </FormControl>
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="contactNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mrsDepartmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-department">No Department</SelectItem>
                        {departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name} ({department.businessUnit.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : mode === "create" ? "Create User" : "Update User"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}