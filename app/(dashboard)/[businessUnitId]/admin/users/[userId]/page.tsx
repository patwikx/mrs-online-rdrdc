import { notFound } from "next/navigation"
import { getUserById, getDepartments, getBusinessUnits } from "@/lib/actions/user-actions"
import { UserViewEdit } from "@/components/user-view-edit"
import { UserRole } from "@prisma/client"

interface ViewUserPageProps {
  params: Promise<{ 
    businessUnitId: string
    userId: string 
  }>
}



export default async function ViewUserPage({ params }: ViewUserPageProps) {
  const { businessUnitId, userId } = await params
  
  const [user, departments, businessUnits] = await Promise.all([
    getUserById(userId),
    getDepartments(),
    getBusinessUnits()
  ])

  if (!user) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-muted-foreground">User Details & Management</p>
        </div>
      </div>

      <UserViewEdit 
        user={user}
        departments={departments}
        businessUnits={businessUnits}
        businessUnitId={businessUnitId}
      />
    </div>
  )
}