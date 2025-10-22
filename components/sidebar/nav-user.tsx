// nav-user.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Settings,
  User,
  Building,
  Moon,
  Sun,
  Building2,
  Phone,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { UserRole } from "@prisma/client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { toast } from "sonner"

interface NavUserProps {
  user: {
    name: string
    email: string
    avatar: string
    firstName: string
    lastName: string
    contactNo: string
    department: string
    businessUnit: string
    role: UserRole
  }
}

// Helper function to get user initials for avatar fallback
function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Helper function to format role display
function getRoleDisplay(role: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    ADMIN: 'Administrator',
    MANAGER: 'Manager',
    STAFF: 'Staff',
    TENANT: 'Tenant',
    TREASURY: 'Treasury',
    PURCHASER: 'Purchaser',
    ACCTG: 'Accounting',
    VIEWER: 'Viewer',
    OWNER: 'Owner',
    STOCKROOM: 'Stockroom',
    MAINTENANCE: 'Maintenance',
  }
  return roleMap[role] || role
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const { setTheme } = useTheme()

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOut({ 
        callbackUrl: '/auth/sign-in',
        redirect: true 
      })
    } catch (error) {
      toast.error('Failed to sign out. Please try again.')
      console.error('Sign out error:', error)
    }
  }, [])

  const userInitials = React.useMemo(() => getUserInitials(user.name), [user.name])
  const roleDisplay = React.useMemo(() => getRoleDisplay(user.role), [user.role])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {roleDisplay}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            {/* User Info Section */}
            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-3 w-3" />
                  <span>{roleDisplay}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{user.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  <span className="truncate">{user.businessUnit}</span>
                </div>
                {user.contactNo && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{user.contactNo}</span>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Theme Toggle Section */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Theme
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}