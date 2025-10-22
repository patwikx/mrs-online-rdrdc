"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Plus, Shield, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ApproverType } from "@prisma/client"
import { assignApprover } from "@/lib/actions/approver-actions"
import { AssignApproverFormData } from "@/types/approver-types"

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
  role: string
}

interface AssignApproverDialogProps {
  departments: Department[]
  users: User[]
  onSuccess: () => void
}

export function AssignApproverDialog({ 
  departments, 
  users, 
  onSuccess 
}: AssignApproverDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<AssignApproverFormData>({
    defaultValues: {
      departmentId: "",
      userId: "",
      approverType: ApproverType.RECOMMENDING,
    },
  })

  const onSubmit = async (data: AssignApproverFormData) => {
    setIsLoading(true)
    try {
      const result = await assignApprover(data)

      if (result.success) {
        toast.success("Approver assigned successfully")
        form.reset()
        setIsOpen(false)
        onSuccess()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error assigning approver:", error)
      toast.error("Failed to assign approver")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Assign Approver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Assign Department Approver
          </DialogTitle>
          <DialogDescription>
            Assign a user as an approver for a specific department. Approvers will be able to review and approve material requests from their assigned department.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Department *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{dept.name}</span>
                            <span className="text-xs text-muted-foreground">{dept.businessUnit.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the department for which this user will serve as an approver.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">User *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{user.firstName} {user.lastName}</span>
                            <span className="text-xs text-muted-foreground">{user.email} • {user.role}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the user who will be assigned as an approver. Only users with appropriate roles are shown.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="approverType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Approver Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose approver type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ApproverType.RECOMMENDING}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Recommending Approver</span>
                            <span className="text-xs text-muted-foreground">First level approval</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value={ApproverType.FINAL}>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Final Approver</span>
                            <span className="text-xs text-muted-foreground">Final level approval</span>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    <strong>Recommending Approver:</strong> Reviews requests first and provides initial approval.<br />
                    <strong>Final Approver:</strong> Provides final approval after recommending approval.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Assign Approver
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