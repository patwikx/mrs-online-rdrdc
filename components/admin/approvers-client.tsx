"use client"

import { useState } from "react"
import { MoreHorizontal, Shield, ShieldCheck, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { ApproverType } from "@prisma/client"
import { removeApprover, toggleApproverStatus } from "@/lib/actions/approver-actions"
import { Department, APPROVER_TYPE_LABELS, APPROVER_TYPE_COLORS } from "@/types/approver-types"
import { AssignApproverDialog } from "./assign-approver-dialog"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface ApproversClientProps {
  initialDepartments: Department[]
  users: User[]
}

export function ApproversClient({ initialDepartments, users }: ApproversClientProps) {
  const [departments, setDepartments] = useState(initialDepartments)
  const [selectedApprover, setSelectedApprover] = useState<{
    id: string
    name: string
    action: 'remove' | 'toggle'
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRemoveApprover = async () => {
    if (!selectedApprover || selectedApprover.action !== 'remove') return

    setIsLoading(true)
    try {
      const result = await removeApprover({ approverId: selectedApprover.id })
      
      if (result.success) {
        setDepartments(prev => 
          prev.map(dept => ({
            ...dept,
            approvers: dept.approvers.filter(approver => approver.id !== selectedApprover.id)
          }))
        )
        toast.success("Approver removed successfully")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error removing approver:", error)
      toast.error("Failed to remove approver")
    } finally {
      setIsLoading(false)
      setSelectedApprover(null)
    }
  }

  const handleToggleStatus = async () => {
    if (!selectedApprover || selectedApprover.action !== 'toggle') return

    setIsLoading(true)
    try {
      const result = await toggleApproverStatus(selectedApprover.id)
      
      if (result.success) {
        setDepartments(prev => 
          prev.map(dept => ({
            ...dept,
            approvers: dept.approvers.map(approver => 
              approver.id === selectedApprover.id 
                ? { ...approver, isActive: !approver.isActive }
                : approver
            )
          }))
        )
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error toggling approver status:", error)
      toast.error("Failed to update approver status")
    } finally {
      setIsLoading(false)
      setSelectedApprover(null)
    }
  }

  const handleSuccess = () => {
    // Refresh the page to get updated data
    window.location.reload()
  }

  const getApproverIcon = (type: ApproverType) => {
    return type === ApproverType.RECOMMENDING ? Shield : ShieldCheck
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Department Approvers</h1>
          <p className="text-muted-foreground">
            Manage approvers for each department's material requests
          </p>
        </div>
        <AssignApproverDialog 
          departments={departments}
          users={users}
          onSuccess={handleSuccess}
        />
      </div>

      {/* Departments List */}
      <div className="grid gap-6">
        {departments.map((department) => {
          const recApprovers = department.approvers.filter(a => a.approverType === ApproverType.RECOMMENDING)
          const finalApprovers = department.approvers.filter(a => a.approverType === ApproverType.FINAL)
          
          return (
            <Card key={department.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">
                      {department.businessUnit.name} - {department.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {department.code} • {department.approvers.length} approver(s)
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {recApprovers.length} Recommending
                    </Badge>
                    <Badge variant="outline">
                      {finalApprovers.length} Final
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {department.approvers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No approvers assigned to this department
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Approver</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {department.approvers.map((approver) => {
                        const Icon = getApproverIcon(approver.approverType)
                        return (
                          <TableRow key={approver.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {approver.user.firstName} {approver.user.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {approver.user.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary" 
                                className={`gap-1 ${APPROVER_TYPE_COLORS[approver.approverType]}`}
                              >
                                <Icon className="h-3 w-3" />
                                {APPROVER_TYPE_LABELS[approver.approverType]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {approver.user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={approver.isActive ? "default" : "secondary"}
                                className={approver.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                              >
                                {approver.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => setSelectedApprover({
                                      id: approver.id,
                                      name: `${approver.user.firstName} ${approver.user.lastName}`,
                                      action: 'toggle'
                                    })}
                                  >
                                    {approver.isActive ? (
                                      <>
                                        <EyeOff className="mr-2 h-4 w-4" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setSelectedApprover({
                                      id: approver.id,
                                      name: `${approver.user.firstName} ${approver.user.lastName}`,
                                      action: 'remove'
                                    })}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Remove Approver Dialog */}
      <AlertDialog 
        open={selectedApprover?.action === 'remove'} 
        onOpenChange={(open) => !open && setSelectedApprover(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Approver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{selectedApprover?.name}" as an approver?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveApprover}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Status Dialog */}
      <AlertDialog 
        open={selectedApprover?.action === 'toggle'} 
        onOpenChange={(open) => !open && setSelectedApprover(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {departments.find(d => d.approvers.find(a => a.id === selectedApprover?.id))?.approvers.find(a => a.id === selectedApprover?.id)?.isActive ? 'Deactivate' : 'Activate'} Approver
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {departments.find(d => d.approvers.find(a => a.id === selectedApprover?.id))?.approvers.find(a => a.id === selectedApprover?.id)?.isActive ? 'deactivate' : 'activate'} "{selectedApprover?.name}" as an approver?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : departments.find(d => d.approvers.find(a => a.id === selectedApprover?.id))?.approvers.find(a => a.id === selectedApprover?.id)?.isActive ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}