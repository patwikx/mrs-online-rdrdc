// app-sidebar.tsx
"use client"

import * as React from "react"
import { 
  FileText, 
  Settings, 
  BarChart3, 
  Shield,
  CheckSquare,
  ShoppingCart
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import type { Session } from "next-auth"
import { UserRole } from "@prisma/client"
import BusinessUnitSwitcher from "../business-unit-swticher"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import type { BusinessUnitItem } from "@/types/business-unit-types"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: Session
  businessUnits: BusinessUnitItem[]
  currentBusinessUnitId: string
}

// Helper function to check if user has admin access
function hasAdminAccess(role: UserRole): boolean {
  const adminRoles: UserRole[] = ['ADMIN', 'OWNER', 'MANAGER'];
  return adminRoles.includes(role);
}

// Helper function to check if user is an approver
function isApprover(role: UserRole): boolean {
  const approverRoles: UserRole[] = ['ADMIN', 'MANAGER', 'OWNER'];
  return approverRoles.includes(role);
}

// Helper function to check if user has purchasing access
function hasPurchasingAccess(role: UserRole): boolean {
  const purchasingRoles: UserRole[] = ['ADMIN', 'MANAGER', 'PURCHASER', 'STOCKROOM'];
  return purchasingRoles.includes(role);
}

// Define navigation items for MRS
const getNavigationItems = (userRole: UserRole, businessUnitId: string) => {
  const baseItems = [
    {
      title: "Dashboard",
      url: `/${businessUnitId}`,
      icon: BarChart3,
      isActive: true,
    },
    {
      title: "Material Requests",
      url: `/${businessUnitId}/material-requests`,
      icon: FileText,
      items: [
        {
          title: "All Requests",
          url: `/${businessUnitId}/material-requests`,
        },
        {
          title: "Create Request",
          url: `/${businessUnitId}/material-requests/create`,
        },
        {
          title: "My Requests",
          url: `/${businessUnitId}/material-requests/my-requests`,
        },
        {
          title: "Draft Requests",
          url: `/${businessUnitId}/material-requests/drafts`,
        },
      ],
    },
  ]

  // Add approver-specific items
  if (isApprover(userRole)) {
    baseItems.push({
      title: "Approvals",
      url: `/${businessUnitId}/approvals`,
      icon: CheckSquare,
      items: [
        {
          title: "Pending Approvals",
          url: `/${businessUnitId}/approvals/pending`,
        },
        {
          title: "Approved Requests",
          url: `/${businessUnitId}/approvals/approved`,
        },
        {
          title: "Disapproved Requests",
          url: `/${businessUnitId}/approvals/disapproved`,
        },
      ],
    })
  }

  // Add purchasing/MRS coordinator section for specific roles
  if (hasPurchasingAccess(userRole)) {
    baseItems.push({
      title: "MRS Coordinator",
      url: `/${businessUnitId}/mrs-coordinator`,
      icon: ShoppingCart,
      items: [
        {
          title: "Posted Requests",
          url: `/${businessUnitId}/mrs-coordinator/posted`,
        },
        {
          title: "Done Requests",
          url: `/${businessUnitId}/mrs-coordinator/received`,
        },
      ],
    })
  }

  // Add reports section
//  baseItems.push({
//    title: "Reports",
//    url: `/${businessUnitId}/reports`,
//    icon: ClipboardList,
//    items: [
//      {
//        title: "Request Reports",
//        url: `/${businessUnitId}/reports/requests`,
//      },
//      {
//        title: "Department Reports",
//        url: `/${businessUnitId}/reports/departments`,
//      },
 //     {
 //       title: "Business Unit Reports",
 //       url: `/${businessUnitId}/reports/business-units`,
 //     },
 //   ],
//  })

  // Add admin-only items
  if (hasAdminAccess(userRole)) {
    baseItems.push({
      title: "Administration",
      url: `/${businessUnitId}/admin`,
      icon: Shield,
      items: [
        {
          title: "Business Units",
          url: `/${businessUnitId}/admin/business-units`,
        },
        {
          title: "Departments",
          url: `/${businessUnitId}/admin/departments`,
        },
        {
          title: "Approvers",
          url: `/${businessUnitId}/admin/approvers`,
        },
        {
          title: "Users",
          url: `/${businessUnitId}/admin/users`,
        },
      ],
    })
  }

  // Add settings
  baseItems.push({
    title: "Settings",
    url: `/${businessUnitId}/settings`,
    icon: Settings,
    items: [
      {
        title: "Profile",
        url: `/${businessUnitId}/settings/profile`,
      },
      {
        title: "Preferences",
        url: `/${businessUnitId}/settings/preferences`,
      },
      {
        title: "Notifications",
        url: `/${businessUnitId}/settings/notifications`,
      },
    ],
  })

  return baseItems
}

export function AppSidebar({ 
  session,
  businessUnits,
  currentBusinessUnitId,
  ...props 
}: AppSidebarProps) {
  const navItems = React.useMemo(() => 
    getNavigationItems(session.user.role, currentBusinessUnitId),
    [session.user.role, currentBusinessUnitId]
  )

  const currentBusinessUnit = businessUnits.find(bu => bu.id === currentBusinessUnitId)

  const userData = React.useMemo(() => ({
    name: session.user.name,
    email: session.user.email ?? '',
    avatar: session.user.image ?? '',
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    contactNo: session.user.contactNo ?? '',
    department: session.user.mrsUserDepartment?.name ?? 'No Department',
    businessUnit: currentBusinessUnit?.name ?? 'No Business Unit',
    role: session.user.role,
  }), [session.user, currentBusinessUnit])

  return (
    <Sidebar collapsible="icon" className="[&_*]:!border-r-0 !border-r-0" {...props}>
      <SidebarHeader>
        <BusinessUnitSwitcher items={businessUnits} className="px-2" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}