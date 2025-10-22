"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { UserRole } from "@prisma/client"
import { MoreHorizontal, Edit, Trash2, Eye, Plus, Search, Filter, X, Building2, Shield, Crown, Briefcase, DollarSign, Calculator, Package, Wrench, User, Glasses, Home, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserDialog } from "@/components/dialogs/user-dialog"
import { deleteUser } from "@/lib/actions/user-actions"

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
  mrsUserDepartment: Department | null
}

interface BusinessUnit {
  id: string
  name: string
  code: string
}

interface UsersTableProps {
  users: User[]
  departments: Department[]
  businessUnits?: BusinessUnit[]
  onRefresh?: () => void
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

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  ADMIN: Shield,
  OWNER: Crown,
  MANAGER: Briefcase,
  TREASURY: DollarSign,
  ACCTG: Calculator,
  PURCHASER: Package,
  STOCKROOM: Package,
  MAINTENANCE: Wrench,
  STAFF: User,
  VIEWER: Glasses,
  TENANT: Home,
}

export function UsersTable({ users, departments, businessUnits = [], onRefresh }: UsersTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setUserToEdit(user)
    setEditDialogOpen(true)
  }

  const handleSuccess = () => {
    onRefresh?.()
    router.refresh()
  }

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      
      const matchesDepartment = 
        departmentFilter === "all" || 
        (departmentFilter === "none" && !user.mrsUserDepartment) ||
        user.mrsUserDepartment?.id === departmentFilter
      
      const matchesStatus = statusFilter === "all" || statusFilter === "active" // All users are active for now
      
      return matchesSearch && matchesRole && matchesDepartment && matchesStatus
    })
  }, [users, searchQuery, roleFilter, departmentFilter, statusFilter])

  const clearFilters = () => {
    setSearchQuery("")
    setRoleFilter("all")
    setDepartmentFilter("all")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const hasActiveFilters = searchQuery || roleFilter !== "all" || departmentFilter !== "all" || statusFilter !== "all"

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize))
    setCurrentPage(1)
  }

  // Reset to first page when filters change
  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1)
    if (filterType === 'search') setSearchQuery(value)
    if (filterType === 'role') setRoleFilter(value)
    if (filterType === 'department') setDepartmentFilter(value)
    if (filterType === 'status') setStatusFilter(value)
  }
  const confirmDelete = () => {
    if (!userToDelete) return

    startTransition(async () => {
      try {
        const result = await deleteUser(userToDelete.id)
        
        if (result.success) {
          toast.success(result.message)
          setDeleteDialogOpen(false)
          setUserToDelete(null)
          router.refresh()
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        console.error("Delete error:", error)
        toast.error("Failed to delete user")
      }
    })
  }



  return (
    <>
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={(value) => handleFilterChange('role', value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center">
                    <Shield className="mr-2 h-3 w-3 text-muted-foreground" />
                    All Roles
                  </div>
                </SelectItem>
                {Object.entries(roleLabels).map(([value, label]) => {
                  const IconComponent = roleIcons[value as UserRole]
                  return (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center">
                        <IconComponent className="mr-2 h-3 w-3 text-muted-foreground" />
                        {label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={(value) => handleFilterChange('department', value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-3 w-3 text-muted-foreground" />
                    All Departments
                  </div>
                </SelectItem>
                <SelectItem value="none">
                  <div className="flex items-center">
                    <X className="mr-2 h-3 w-3 text-muted-foreground" />
                    No Department
                  </div>
                </SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    <div className="flex items-center">
                      <Building2 className="mr-2 h-3 w-3 text-muted-foreground" />
                      {department.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center">
                    <div className="mr-2 h-2 w-2 rounded-full bg-gray-400" />
                    All Status
                  </div>
                </SelectItem>
                <SelectItem value="active">
                  <div className="flex items-center">
                    <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center">
                    <div className="mr-2 h-2 w-2 rounded-full bg-red-500" />
                    Inactive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-8 px-2 lg:px-3"
              >
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Results summary */}
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border rounded-sm" />
                  </div>
                </TableHead>
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Role</TableHead>
                <TableHead className="font-medium">Department</TableHead>
                <TableHead className="font-medium">Business Unit</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Contact</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        {hasActiveFilters ? <Filter className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </div>
                      <p>{hasActiveFilters ? "No users match your filters" : "No users found"}</p>
                      <p className="text-xs">
                        {hasActiveFilters ? "Try adjusting your search criteria" : "Get started by adding your first user"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border rounded-sm" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${roleColors[user.role]} text-xs font-medium`}
                      >
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.mrsUserDepartment?.name || (
                        <span className="text-muted-foreground">No Department</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.mrsUserDepartment?.businessUnit.name || (
                        <span className="text-muted-foreground">No Business Unit</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="bg-green-50 text-green-700 border-green-200 text-xs font-medium"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.contactNo || "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(user)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">Rows per page</p>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              {userToDelete && ` "${userToDelete.firstName} ${userToDelete.lastName}"`} 
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        departments={departments}
        businessUnits={businessUnits}
        mode="create"
        onSuccess={handleSuccess}
      />

      <UserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={userToEdit}
        departments={departments}
        businessUnits={businessUnits}
        mode="edit"
        onSuccess={handleSuccess}
      />
    </>
  )
}