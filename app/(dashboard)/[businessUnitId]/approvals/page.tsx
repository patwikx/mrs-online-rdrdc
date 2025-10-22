import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, FileText } from "lucide-react"
import Link from "next/link"

interface ApprovalsPageProps {
  params: {
    businessUnitId: string
  }
}

export default async function ApprovalsPage({ params }: ApprovalsPageProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/sign-in")
  }

  const { businessUnitId } = await params

  // Check if user can approve requests
  if (!["ADMIN", "MANAGER", "PURCHASER", "ACCTG", "TREASURY"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  const approvalCards = [
    {
      title: "Pending Approvals",
      description: "Review and approve material requests assigned to you",
      icon: Clock,
      href: `/${businessUnitId}/approvals/pending`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 hover:bg-yellow-100",
    },
    {
      title: "Approved Requests",
      description: "View requests you have approved",
      icon: CheckCircle,
      href: `/${businessUnitId}/approvals/approved`,
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
    },
    {
      title: "Disapproved Requests",
      description: "View requests you have disapproved",
      icon: XCircle,
      href: `/${businessUnitId}/approvals/disapproved`,
      color: "text-red-600",
      bgColor: "bg-red-50 hover:bg-red-100",
    },
    {
      title: "All Approvals",
      description: "Complete history of your approval activities",
      icon: FileText,
      href: `/${businessUnitId}/approvals/all`,
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
  ]

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Approvals</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {approvalCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <Card className={`hover:shadow-md transition-all cursor-pointer ${card.bgColor}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats or Recent Activity could go here */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Dashboard</CardTitle>
          <CardDescription>
            Manage material request approvals efficiently. Click on any card above to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• <strong>Pending Approvals:</strong> Review requests waiting for your approval</p>
            <p>• <strong>Approved Requests:</strong> Track requests you've approved</p>
            <p>• <strong>Disapproved Requests:</strong> Review requests you've rejected with reasons</p>
            <p>• <strong>All Approvals:</strong> Complete history of your approval activities</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}