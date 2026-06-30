/**
 * Dashboard Layout
 * Protected layout with Sidebar + Header
 * Wraps all authenticated pages
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {children}
    </div>
  );
}
