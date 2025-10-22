import { auth } from "@/auth"
import { redirect } from "next/navigation"

interface AdminLayoutProps {
  children: React.ReactNode
  params: {
    businessUnitId: string
  }
}

export default async function AdminLayout({ 
  children, 
  params 
}: AdminLayoutProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/sign-in")
  }

  // Check if user has admin privileges
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  return <>{children}</>
}