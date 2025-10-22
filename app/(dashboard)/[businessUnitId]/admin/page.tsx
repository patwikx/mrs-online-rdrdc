import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Building, UserCheck } from "lucide-react"
import Link from "next/link"

interface AdminPageProps {
  params: {
    businessUnitId: string
  }
}

export default async function AdminPage({ params }: AdminPageProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/sign-in")
  }

  const { businessUnitId } = await params

  const adminCards = [
    {
      title: "Business Units",
      description: "Manage business units and their configurations",
      icon: Building,
      href: `/${businessUnitId}/admin/business-units`,
      color: "text-blue-600",
    },
    {
      title: "Departments",
      description: "Manage departments within business units",
      icon: Users,
      href: `/${businessUnitId}/admin/departments`,
      color: "text-green-600",
    },
    {
      title: "Approvers",
      description: "Assign and manage department approvers",
      icon: UserCheck,
      href: `/${businessUnitId}/admin/approvers`,
      color: "text-purple-600",
    },
    {
      title: "Users",
      description: "Manage user accounts and permissions",
      icon: Shield,
      href: `/${businessUnitId}/admin/users`,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Administration</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
    </div>
  )
}