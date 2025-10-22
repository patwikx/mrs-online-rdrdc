import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await auth();

  // Redirect to sign-in if there's no session or user
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Redirect to first business unit
  const firstBusinessUnit = await prisma.businessUnit.findFirst({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  if (firstBusinessUnit) {
    redirect(`/${firstBusinessUnit.id}`);
  } else {
    redirect("/select-unit");
  }
}