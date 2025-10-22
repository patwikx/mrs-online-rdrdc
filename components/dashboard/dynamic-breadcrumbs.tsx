'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Package, 
  Users, 
  FileText, 
  ChartBar as BarChart3, 
  Settings, 
  Building2, 
  Shield, 
  Home, 
  Plus, 
  Eye, 
  UserPlus,
  CheckSquare,
  ClipboardList,
  Building,
  UserCog,
  TrendingUp,
  Archive,
  Clock,
  XCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface BreadcrumbItemType {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isCurrentPage?: boolean;
}

// Route configuration for MRS
const routeConfig: Record<string, { label: string; icon?: React.ComponentType<{ className?: string }> }> = {
  // Dashboard
  'dashboard': { label: 'Dashboard', icon: Home },
  'dashboard/analytics': { label: 'Analytics', icon: BarChart3 },

  // Material Requests
  'material-requests': { label: 'Material Requests', icon: FileText },
  'material-requests/create': { label: 'Create Request', icon: Plus },
  'material-requests/my-requests': { label: 'My Requests', icon: FileText },
  'material-requests/drafts': { label: 'Draft Requests', icon: Clock },

  // Approvals
  'approvals': { label: 'Approvals', icon: CheckSquare },
  'approvals/pending': { label: 'Pending Approvals', icon: Clock },
  'approvals/approved': { label: 'Approved Requests', icon: CheckCircle },
  'approvals/disapproved': { label: 'Disapproved Requests', icon: XCircle },

  // Inventory
  'inventory': { label: 'Inventory', icon: Package },
  'inventory/items': { label: 'Items', icon: Package },
  'inventory/stock-levels': { label: 'Stock Levels', icon: TrendingUp },
  'inventory/receiving': { label: 'Receiving', icon: Archive },

  // Reports
  'reports': { label: 'Reports', icon: ClipboardList },
  'reports/requests': { label: 'Request Reports', icon: FileText },
  'reports/departments': { label: 'Department Reports', icon: Building2 },
  'reports/business-units': { label: 'Business Unit Reports', icon: Building },

  // Administration
  'admin': { label: 'Administration', icon: Shield },
  'admin/business-units': { label: 'Business Units', icon: Building },
  'admin/business-units/create': { label: 'Create Business Unit', icon: Plus },
  'admin/departments': { label: 'Departments', icon: Building2 },
  'admin/departments/create': { label: 'Create Department', icon: Plus },
  'admin/approvers': { label: 'Approvers', icon: UserCog },
  'admin/approvers/assign': { label: 'Assign Approver', icon: UserPlus },
  'admin/users': { label: 'Users', icon: Users },
  'admin/users/create': { label: 'Create User', icon: UserPlus },

  // Settings
  'settings': { label: 'Settings', icon: Settings },
  'settings/profile': { label: 'Profile', icon: Users },
  'settings/preferences': { label: 'Preferences', icon: Settings },
  'settings/notifications': { label: 'Notifications', icon: AlertCircle },
};

interface DynamicBreadcrumbsProps {
  businessUnitName?: string;
  userContext?: {
    userId: string;
    firstName: string;
    lastName: string;
  };
}

export function DynamicBreadcrumbs({ businessUnitName, userContext }: DynamicBreadcrumbsProps = {}) {
  const pathname = usePathname();
  const params = useParams();
  const businessUnitId = params.businessUnitId as string;
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string } | null>(null);

  // Detect if we're on a user page and fetch user data
  useEffect(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const isUserPage = pathSegments.includes('admin') && pathSegments.includes('users') && pathSegments.length >= 4;
    
    if (isUserPage && !userContext) {
      const userId = pathSegments[pathSegments.length - 1];
      const isUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      if (isUuidPattern) {
        // Fetch user data
        fetch(`/api/users/${userId}`)
          .then(res => res.json())
          .then(data => {
            if (data.firstName && data.lastName) {
              setUserInfo({ firstName: data.firstName, lastName: data.lastName });
            }
          })
          .catch(() => {
            // Ignore errors, will fall back to default behavior
          });
      }
    }
  }, [pathname, userContext]);
  
  const generateBreadcrumbs = (): BreadcrumbItemType[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItemType[] = [];
    
    // If no segments, we're at root
    if (pathSegments.length === 0) {
      return breadcrumbs;
    }

    let currentPath = '';
    let actualPath = '';
    
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      
      // Build the actual path
      actualPath = actualPath ? `${actualPath}/${segment}` : segment;
      
      // Check if this is the business unit ID (first segment)
      const isBusinessUnitId = i === 0 && segment === businessUnitId;
      
      // Check if this is a dynamic route (UUID or ID pattern) but not the business unit ID
      const isUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
      const isNumericId = /^\d+$/.test(segment);
      const isDynamicRoute = (isUuidPattern || isNumericId) && !isBusinessUnitId;
      
      if (isBusinessUnitId) {
        // For business unit ID, show the business unit name
        const isLastSegment = i === pathSegments.length - 1;
        breadcrumbs.push({
          label: businessUnitName || 'Business Unit',
          href: isLastSegment ? undefined : `/${actualPath}`,
          icon: Building,
          isCurrentPage: isLastSegment
        });
      } else if (isDynamicRoute) {
        // Check if this is a user ID and we have user context or fetched user info
        const isUserRoute = currentPath === 'admin/users';
        const userData = userContext || userInfo;
        
        if (isUserRoute && userData) {
          const isLastSegment = i === pathSegments.length - 1;
          breadcrumbs.push({
            label: `${userData.firstName} ${userData.lastName}`,
            href: isLastSegment ? undefined : `/${actualPath}`,
            icon: Users,
            isCurrentPage: isLastSegment
          });
        } else {
          // For other dynamic segments, use the parent route's label + "Details" or "View"
          const parentPath = currentPath;
          const parentConfig = routeConfig[parentPath];
          const isLastSegment = i === pathSegments.length - 1;
          
          breadcrumbs.push({
            label: parentConfig ? `View ${parentConfig.label}` : 'Details',
            href: isLastSegment ? undefined : `/${actualPath}`,
            icon: Eye,
            isCurrentPage: isLastSegment
          });
        }
      } else {
        // For non-dynamic segments, build the currentPath for config lookup
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        
        const config = routeConfig[currentPath];
        const isLastSegment = i === pathSegments.length - 1;
        
        breadcrumbs.push({
          label: config?.label || formatSegmentLabel(segment),
          href: isLastSegment ? undefined : `/${actualPath}`,
          icon: config?.icon,
          isCurrentPage: isLastSegment
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Mobile-optimized breadcrumbs - show only last 2 items on mobile
  const getMobileBreadcrumbs = () => {
    if (breadcrumbs.length <= 2) return breadcrumbs;
    return breadcrumbs.slice(-2);
  };

  const mobileBreadcrumbs = getMobileBreadcrumbs();

  return (
    <div className="w-full">
      {/* Mobile Breadcrumbs - Show only last 2 items */}
      <div className="block sm:hidden">
        <Breadcrumb>
          <BreadcrumbList className="flex-wrap">
            {mobileBreadcrumbs.map((crumb, index) => (
              <React.Fragment key={`mobile-${crumb.label}-${index}`}>
                <BreadcrumbItem>
                  {crumb.isCurrentPage ? (
                    <BreadcrumbPage className="flex items-center gap-1.5 text-sm">
                      {crumb.icon && <crumb.icon className="h-3.5 w-3.5" />}
                      <span className="truncate max-w-[120px]">{crumb.label}</span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href!} className="flex items-center gap-1.5 text-sm">
                        {crumb.icon && <crumb.icon className="h-3.5 w-3.5" />}
                        <span className="truncate max-w-[120px]">{crumb.label}</span>
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < mobileBreadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Desktop Breadcrumbs - Show all items */}
      <div className="hidden sm:block">
        <Breadcrumb>
          <BreadcrumbList className="flex-wrap">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={`desktop-${crumb.label}-${index}`}>
                <BreadcrumbItem>
                  {crumb.isCurrentPage ? (
                    <BreadcrumbPage className="flex items-center gap-2">
                      {crumb.icon && <crumb.icon className="h-4 w-4" />}
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href!} className="flex items-center gap-2 hover:text-foreground transition-colors">
                        {crumb.icon && <crumb.icon className="h-4 w-4" />}
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}

// Helper function to format segment labels
function formatSegmentLabel(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}