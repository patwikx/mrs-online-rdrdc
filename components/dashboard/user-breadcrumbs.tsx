"use client"

import { DynamicBreadcrumbs } from './dynamic-breadcrumbs'

interface UserBreadcrumbsProps {
  businessUnitName?: string
  user?: {
    id: string
    firstName: string
    lastName: string
  }
}

export function UserBreadcrumbs({ businessUnitName, user }: UserBreadcrumbsProps) {
  return (
    <DynamicBreadcrumbs 
      businessUnitName={businessUnitName}
      userContext={user ? {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName
      } : undefined}
    />
  )
}