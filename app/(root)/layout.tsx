// app/(root)/layout.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { BusinessUnitModal } from '@/components/modals/business-unit-modal';
import type { Session } from 'next-auth';

// Type guard to ensure we have a complete user session
function isValidUserSession(session: Session | null): session is Session & {
  user: NonNullable<Session['user']> & {
    id: string;
    activeBusinessUnit: NonNullable<Session['user']['activeBusinessUnit']>;
    availableBusinessUnits: NonNullable<Session['user']['availableBusinessUnits']>;
  }
} {
  return !!(
    session?.user?.id &&
    session.user.activeBusinessUnit?.id &&
    session.user.availableBusinessUnits &&
    session.user.availableBusinessUnits.length > 0
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get the session, which includes the user's active business unit
  const session = await auth();

  // 2. If there's no user session, redirect to sign-in
  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  // 3. Check if user has a valid business unit assignment
  if (isValidUserSession(session)) {
    // --- Scenario 1: User has valid business unit assignment ---
    // Redirect them to the dashboard
    redirect('/dashboard');
  }

  // --- Scenario 2: User has NO business unit assignment ---
  // If the code reaches here, it means the user is logged in but:
  // - Has no active business unit assigned
  // - Has no available business units
  // - Admin hasn't assigned them to any business unit yet
  // - Their business unit was deactivated
  // - Data integrity issue
  
  // Show a message or modal to handle this edge case
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter">
            No Business Unit Assigned
          </h1>
          <p className="text-muted-foreground">
            Your account is active, but you haven&apos;t been assigned to any business unit yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator to assign you to a business unit.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-4 text-sm">
          <h3 className="font-semibold mb-2">Account Information</h3>
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Name:</dt>
              <dd className="font-medium">{session.user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email:</dt>
              <dd className="font-medium">{session.user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Role:</dt>
              <dd className="font-medium">{session.user.role}</dd>
            </div>
            {session.user.mrsUserDepartment && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Department:</dt>
                <dd className="font-medium">{session.user.mrsUserDepartment.name}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-col gap-2">
          <form action="/api/auth/signout" method="POST">
            <button 
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
      
      {/* Business Unit Modal for admin actions if needed */}
      <BusinessUnitModal />
      {children}
    </div>
  );
}