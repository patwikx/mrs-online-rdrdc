import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserProfile } from "@/lib/actions/user-actions"
import { ProfileClient } from "@/components/settings/profile-client"
import { Skeleton } from "@/components/ui/skeleton"

interface ProfilePageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/sign-in")
  }

  const { businessUnitId } = await params

  return (
    <div className="flex-1 space-y-4">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent 
          userId={session.user.id} 
          businessUnitId={businessUnitId}
        />
      </Suspense>
    </div>
  )
}

async function ProfileContent({ 
  userId, 
  businessUnitId 
}: { 
  userId: string
  businessUnitId: string 
}) {
  const userProfile = await getUserProfile(userId)
  
  if (!userProfile) {
    redirect("/auth/sign-in")
  }
  
  return (
    <ProfileClient 
      user={userProfile} 
      businessUnitId={businessUnitId}
    />
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex-1 space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* Profile Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  )
}