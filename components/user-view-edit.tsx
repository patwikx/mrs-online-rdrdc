"use client"

import { useState } from "react"
import { UserRole } from "@prisma/client"
import { Edit, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UserDialog } from "@/components/dialogs/user-dialog"

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
  createdAt: Date
  updatedAt: Date
  mrsUserDepartment: Department | null
}

interface UserViewEditProps {
  user: User
  departments: Department[]
  businessUnits: BusinessUnit[]
  businessUnitId: string
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

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-red-50 text-red-700 border-red-200",
  OWNER: "bg-purple-50 text-purple-700 border-purple-200",
  MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
  TREASURY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ACCTG: "bg-amber-50 text-amber-700 border-amber-200",
  PURCHASER: "bg-orange-50 text-orange-700 border-orange-200",
  STOCKROOM: "bg-indigo-50 text-indigo-700 border-indigo-200",
  MAINTENANCE: "bg-gray-50 text-gray-700 border-gray-200",
  STAFF: "bg-slate-50 text-slate-700 border-slate-200",
  VIEWER: "bg-zinc-50 text-zinc-700 border-zinc-200",
  TENANT: "bg-pink-50 text-pink-700 border-pink-200",
}

export function UserViewEdit({ user, departments, businessUnits, businessUnitId }: UserViewEditProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const handleEditSuccess = () => {
    // Refresh the page to show updated data
    window.location.reload()
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic user details and contact information</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                <p className="text-sm font-medium">{user.firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                <p className="text-sm font-medium">{user.lastName}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email Address</label>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contact Number</label>
              <p className="text-sm font-medium">{user.contactNo || "Not provided"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Role and organizational details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <div className="mt-1">
                <Badge 
                  variant="outline" 
                  className={`${roleColors[user.role]} text-xs font-medium`}
                >
                  {roleLabels[user.role]}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Department</label>
              <p className="text-sm font-medium">
                {user.mrsUserDepartment?.name || "No Department Assigned"}
              </p>
              {user.mrsUserDepartment && (
                <p className="text-xs text-muted-foreground">
                  Code: {user.mrsUserDepartment.code}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Business Unit</label>
              <p className="text-sm font-medium">
                {user.mrsUserDepartment?.businessUnit.name || "No Business Unit"}
              </p>
              {user.mrsUserDepartment?.businessUnit && (
                <p className="text-xs text-muted-foreground">
                  Code: {user.mrsUserDepartment.businessUnit.code}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Account creation and modification details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm font-medium">{formatDate(user.updatedAt)}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="text-sm font-mono text-muted-foreground">{user.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <UserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={user}
        departments={departments}
        businessUnits={businessUnits}
        mode="edit"
        onSuccess={handleEditSuccess}
      />
    </>
  )
}