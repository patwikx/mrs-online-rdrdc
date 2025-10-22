import "../globals.css";
import { Toaster } from 'sonner';

export const metadata = {
  title: "Dashboard | Material Request System",
  description: "Material Request System for Business Units",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <Toaster />
    </div>
  )
}