import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function SelectUnitPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Check if there are any business units
  const businessUnits = await prisma.businessUnit.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  if (businessUnits.length > 0) {
    // If business units exist, redirect to the first one
    redirect(`/${businessUnits[0].id}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            No Business Units Available
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please contact your administrator to set up business units.
          </p>
        </div>
      </div>
    </div>
  )
}