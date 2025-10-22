"use client"

import { useState, useMemo } from "react"
import { MoreHorizontal, Users, Trash2, Eye, EyeOff, Building, UserCheck, FileText, Search, Plus, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { deleteDepartment, toggleDepartmentStatus } from "@/lib/actions/department-actions"
import { Department, BusinessUnit } from "@/types/admin-types"
import { DepartmentDialog } from "./department-dialog"

interface DepartmentsClientProps {
  initialDepartments: Department[]
  businessUnits: BusinessUnit[]
}

export function DepartmentsClient({ initialDepartments, businessUnits }: DepartmentsClientProps) {
  const [departments, setDepartments] = useState(initialDepartments)
  const [selectedDepartment, setSelectedDepartment] = useState<{
    id: string
    name: string
    action: 'delete' | 'toggle'
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filter departments based on search term, business unit, and status
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => {
      const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.businessUnit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesBusinessUnit = selectedBusinessUnit === "all" || dept.businessUnitId === selectedBusinessUnit
      const matchesStatus = selectedStatus === "all" || 
        (selectedStatus === "active" && dept.isActive) ||
        (selectedStatus === "inactive" && !dept.isActive)
      
      return matchesSearch && matchesBusinessUnit && matchesStatus
    })
  }, [departments, searchTerm, selectedBusinessUnit, selectedStatus])

  // Pagination calculations
  const totalPages = Math.ceil(filteredDepartments.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1)
    if (filterType === 'search') setSearchTerm(value)
    if (filterType === 'businessUnit') setSelectedBusinessUnit(value)
    if (filterType === 'status') setSelectedStatus(value)
  }

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize))
    setCurrentPage(1)
  }

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment || selectedDepartment.action !== 'delete') return

    setIsLoading(true)
    try {
      const result = await deleteDepartment(selectedDepartment.id)
      
      if (result.success) {
        setDepartments(prev => prev.filter(dept => dept.id !== selectedDepartment.id))
        toast.success("Department deleted successfully")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error deleting department:", error)
      toast.error("Failed to delete department")
    } finally {
      setIsLoading(false)
      setSelectedDepartment(null)
    }
  }

  const handleToggleStatus = async () => {
    if (!selectedDepartment || selectedDepartment.action !== 'toggle') return

    setIsLoading(true)
    try {
      const result = await toggleDepartmentStatus(selectedDepartment.id)
      
      if (result.success) {
        setDepartments(prev => 
          prev.map(dept => 
            dept.id === selectedDepartment.id 
              ? { ...dept, isActive: !dept.isActive }
              : dept
          )
        )
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error toggling department status:", error)
      toast.error("Failed to update department status")
    } finally {
      setIsLoading(false)
      setSelectedDepartment(null)
    }
  }

  const handleSuccess = () => {
    // Refresh the page to get updated data
    window.location.reload()
  }

  return (
    <div className="flex-1 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Departments</h2>
          <p className="text-muted-foreground">
            Manage departments within business units and their organizational structure
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Select value={selectedBusinessUnit} onValueChange={(value) => handleFilterChange('businessUnit', value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Business Units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Business Units</SelectItem>
              {businessUnits.map((bu) => (
                <SelectItem key={bu.id} value={bu.id}>
                  {bu.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DepartmentDialog 
          businessUnits={businessUnits}
          onSuccess={handleSuccess}
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
          }
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1} to {Math.min(endIndex, filteredDepartments.length)} of {filteredDepartments.length} departments
      </div>

      {/* Departments Table */}
      <div className="rounded-md border">
        {filteredDepartments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || selectedBusinessUnit !== "all" || selectedStatus !== "all" 
              ? "No departments found matching your filters." 
              : "No departments found. Create your first department to get started."
            }
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Business Unit</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Approvers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDepartments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {department.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{department.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{department.businessUnit.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {department.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{department._count?.users || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{department._count?.requests || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{department._count?.approvers || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={department.isActive ? "default" : "secondary"}
                      className={department.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {department.isActive ? "Active" : "Inactive"}
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
                        <DepartmentDialog 
                          department={department}
                          businessUnits={businessUnits}
                          onSuccess={handleSuccess}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Users className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem
                          onClick={() => setSelectedDepartment({
                            id: department.id,
                            name: department.name,
                            action: 'toggle'
                          })}
                        >
                          {department.isActive ? (
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
                          onClick={() => setSelectedDepartment({
                            id: department.id,
                            name: department.name,
                            action: 'delete'
                          })}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {filteredDepartments.length > 0 && (
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

      {/* Delete Department Dialog */}
      <AlertDialog 
        open={selectedDepartment?.action === 'delete'} 
        onOpenChange={(open) => !open && setSelectedDepartment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDepartment?.name}"?
              This action cannot be undone and will fail if there are existing users, requests, or approvers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDepartment}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Status Dialog */}
      <AlertDialog 
        open={selectedDepartment?.action === 'toggle'} 
        onOpenChange={(open) => !open && setSelectedDepartment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {departments.find(dept => dept.id === selectedDepartment?.id)?.isActive ? 'Deactivate' : 'Activate'} Department
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {departments.find(dept => dept.id === selectedDepartment?.id)?.isActive ? 'deactivate' : 'activate'} "{selectedDepartment?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : departments.find(dept => dept.id === selectedDepartment?.id)?.isActive ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}