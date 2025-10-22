import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { UsersTable } from "@/components/tables/users-table"
import { getUsers, getDepartments, getBusinessUnits } from "@/lib/actions/user-actions"

interface UsersPageProps {
  params: Promise<{ businessUnitId: string }>
}

function UsersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="border rounded-lg">
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <div className="flex space-x-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

async function UsersContent({ businessUnitId }: { businessUnitId: string }) {
  const [users, departments, businessUnits] = await Promise.all([
    getUsers(),
    getDepartments(),
    getBusinessUnits()
  ])

  return <UsersTable users={users} departments={departments} businessUnits={businessUnits} />
}

export default async function UsersPage({ params }: UsersPageProps) {
  const { businessUnitId } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system users, roles, and department assignments
          </p>
        </div>
      </div>

      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersContent businessUnitId={businessUnitId} />
      </Suspense>
    </div>
  )
}