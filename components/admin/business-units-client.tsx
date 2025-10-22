"use client"

import { useState, useMemo } from "react"
import { MoreHorizontal, Building, Trash2, Eye, EyeOff, Users, Search, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { deleteBusinessUnit, toggleBusinessUnitStatus } from "@/lib/actions/business-unit-actions"
import { BusinessUnit } from "@/types/admin-types"
import { BusinessUnitDialog } from "./business-unit-dialog"

interface BusinessUnitsClientProps {
  initialBusinessUnits: BusinessUnit[]
}

export function BusinessUnitsClient({ initialBusinessUnits }: BusinessUnitsClientProps) {
  const [businessUnits, setBusinessUnits] = useState(initialBusinessUnits)
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<{
    id: string
    name: string
    action: 'delete' | 'toggle'
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filter business units based on search term
  const filteredBusinessUnits = useMemo(() => {
    return businessUnits.filter(bu =>
      bu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bu.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bu.description && bu.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [businessUnits, searchTerm])

  // Pagination calculations
  const totalPages = Math.ceil(filteredBusinessUnits.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedBusinessUnits = filteredBusinessUnits.slice(startIndex, endIndex)

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize))
    setCurrentPage(1)
  }

  const handleDeleteBusinessUnit = async () => {
    if (!selectedBusinessUnit || selectedBusinessUnit.action !== 'delete') return

    setIsLoading(true)
    try {
      const result = await deleteBusinessUnit(selectedBusinessUnit.id)
      
      if (result.success) {
        setBusinessUnits(prev => prev.filter(bu => bu.id !== selectedBusinessUnit.id))
        toast.success("Business unit deleted successfully")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error deleting business unit:", error)
      toast.error("Failed to delete business unit")
    } finally {
      setIsLoading(false)
      setSelectedBusinessUnit(null)
    }
  }

  const handleToggleStatus = async () => {
    if (!selectedBusinessUnit || selectedBusinessUnit.action !== 'toggle') return

    setIsLoading(true)
    try {
      const result = await toggleBusinessUnitStatus(selectedBusinessUnit.id)
      
      if (result.success) {
        setBusinessUnits(prev => 
          prev.map(bu => 
            bu.id === selectedBusinessUnit.id 
              ? { ...bu, isActive: !bu.isActive }
              : bu
          )
        )
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error toggling business unit status:", error)
      toast.error("Failed to update business unit status")
    } finally {
      setIsLoading(false)
      setSelectedBusinessUnit(null)
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
          <h2 className="text-3xl font-bold tracking-tight">Business Units</h2>
          <p className="text-muted-foreground">
            Manage business units and their organizational structure
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search business units..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
        </div>
        <BusinessUnitDialog 
          onSuccess={handleSuccess}
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Business Unit
            </Button>
          }
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1} to {Math.min(endIndex, filteredBusinessUnits.length)} of {filteredBusinessUnits.length} business units
      </div>

      {/* Business Units Table */}
      <div className="rounded-md border">
        {filteredBusinessUnits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No business units found matching your search." : "No business units found. Create your first business unit to get started."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Departments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBusinessUnits.map((businessUnit) => (
                <TableRow key={businessUnit.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {businessUnit.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{businessUnit.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {businessUnit.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{businessUnit.departments.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={businessUnit.isActive ? "default" : "secondary"}
                      className={businessUnit.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {businessUnit.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(businessUnit.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <BusinessUnitDialog 
                          businessUnit={businessUnit}
                          onSuccess={handleSuccess}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Building className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem
                          onClick={() => setSelectedBusinessUnit({
                            id: businessUnit.id,
                            name: businessUnit.name,
                            action: 'toggle'
                          })}
                        >
                          {businessUnit.isActive ? (
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
                          onClick={() => setSelectedBusinessUnit({
                            id: businessUnit.id,
                            name: businessUnit.name,
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
      {filteredBusinessUnits.length > 0 && (
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

      {/* Delete Business Unit Dialog */}
      <AlertDialog 
        open={selectedBusinessUnit?.action === 'delete'} 
        onOpenChange={(open) => !open && setSelectedBusinessUnit(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedBusinessUnit?.name}&quot;?
              This action cannot be undone and will fail if there are existing departments or requests.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBusinessUnit}
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
        open={selectedBusinessUnit?.action === 'toggle'} 
        onOpenChange={(open) => !open && setSelectedBusinessUnit(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {businessUnits.find(bu => bu.id === selectedBusinessUnit?.id)?.isActive ? 'Deactivate' : 'Activate'} Business Unit
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {businessUnits.find(bu => bu.id === selectedBusinessUnit?.id)?.isActive ? 'deactivate' : 'activate'} &quot;{selectedBusinessUnit?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : businessUnits.find(bu => bu.id === selectedBusinessUnit?.id)?.isActive ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}