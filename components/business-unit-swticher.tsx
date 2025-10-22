"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Store, 
  Plus, 
  Check, 
  Monitor, 
  Smartphone, 
  Code, 
  Settings, 
  ChevronDown 
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
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

import { useBusinessUnitModal } from "@/hooks/use-bu-modal"
import { BusinessUnitItem } from "@/types/business-unit-types"

interface BusinessUnitSwitcherProps {
  items: BusinessUnitItem[]
  className?: string
}

const getAppTypeIcon = (name?: string): React.ComponentType<{ className?: string }> => {
  if (!name) return Monitor
  const lowerName = name.toLowerCase()
  
  if (lowerName.includes('mobile') || lowerName.includes('app')) {
    return Smartphone
  }
  if (lowerName.includes('admin') || lowerName.includes('settings')) {
    return Settings
  }
  if (lowerName.includes('store') || lowerName.includes('shop')) {
    return Store
  }
  if (lowerName.includes('dev') || lowerName.includes('code')) {
    return Code
  }
  
  return Monitor
}

const getAppTypeLabel = (name?: string): string => {
  if (!name) return 'Business Unit'
  const lowerName = name.toLowerCase()
  
  if (lowerName.includes('mobile') || lowerName.includes('app')) {
    return 'Mobile application'
  }
  if (lowerName.includes('admin')) {
    return 'Business Unit'
  }
  if (lowerName.includes('dev')) {
    return 'Business Unit'
  }
  
  return 'Business Unit'
}

export default function BusinessUnitSwitcher({ 
  className, 
  items = [] 
}: BusinessUnitSwitcherProps) {
  const businessUnitModal = useBusinessUnitModal()
  const params = useParams()
  const router = useRouter()
  const { isMobile } = useSidebar()
  const [open, setOpen] = React.useState(false)

  const isSwitcherActive = items.length > 1
  const currentBusinessUnit = items.find((item) => item.id === params.businessUnitId)

  const onBusinessUnitSelect = (businessUnitId: string) => {
    setOpen(false)
    router.push(`/${businessUnitId}`)
    router.refresh()
  }

  const handleAddProduct = () => {
    setOpen(false)
    businessUnitModal.onOpen()
  }

  const IconComponent = getAppTypeIcon(currentBusinessUnit?.name || '')

  // Static display for single unit users
  if (!isSwitcherActive) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className={cn(
              "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
              className
            )}
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <IconComponent className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {currentBusinessUnit?.name || "No Unit"}
              </span>
              <span className="truncate text-xs">
                {getAppTypeLabel(currentBusinessUnit?.name || '')}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Interactive dropdown for multi-unit users
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <IconComponent className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {currentBusinessUnit?.name || "Select Unit"}
                </span>
                <span className="truncate text-xs">
                  {getAppTypeLabel(currentBusinessUnit?.name || '')}
                </span>
              </div>
              <ChevronDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Business Units
            </DropdownMenuLabel>

            {/* Current/Selected item */}
            {currentBusinessUnit && (
              <DropdownMenuItem
                onClick={() => onBusinessUnitSelect(currentBusinessUnit.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <IconComponent className="size-4 shrink-0" />
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <div className="font-medium truncate">
                    {currentBusinessUnit.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {getAppTypeLabel(currentBusinessUnit.name)}
                  </div>
                </div>
                <Check className="ml-auto size-4" />
              </DropdownMenuItem>
            )}

            {/* Other business units */}
            {items
              .filter((unit) => unit.id !== currentBusinessUnit?.id)
              .slice(0, 5)
              .map((unit) => {
                const Icon = getAppTypeIcon(unit.name)
                return (
                  <DropdownMenuItem
                    key={unit.id}
                    onClick={() => onBusinessUnitSelect(unit.id)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <Icon className="size-4 shrink-0" />
                    </div>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <div className="font-medium truncate">
                        {unit.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {getAppTypeLabel(unit.name)}
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })}

            {/* Show overflow indicator if there are more units */}
            {items.length > 6 && (
              <DropdownMenuItem disabled className="gap-2 p-2 opacity-50">
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Monitor className="size-4 shrink-0" />
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <div className="text-sm truncate">
                    +{items.length - 6} more units...
                  </div>
                </div>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Add Business Unit Option */}
            <DropdownMenuItem
              onClick={handleAddProduct}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
                <Plus className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <div className="font-medium">Add Business Unit</div>
                <div className="text-xs text-muted-foreground">
                  Create new unit
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}