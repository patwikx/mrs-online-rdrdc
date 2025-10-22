
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default async function AllApprovalsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/sign-in")
  }

  // Check if user can approve requests
  if (!["ADMIN", "MANAGER", "PURCHASER", "ACCTG", "TREASURY"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Approvals</h2>
          <p className="text-muted-foreground">
            Complete history of your approval activities
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Approval History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-medium">Coming Soon</p>
            <p className="text-sm">
              This page will show your complete approval history with filters and detailed analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}