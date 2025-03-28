import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { Separator } from "@/components/ui/separator"
import { ThemeSwitcher } from "@/components/theme-switcher"

export const metadata = {
  title: "Dashboard - Quản lý nhà hàng",
  description: "Trang quản lý nhà hàng và đặt bàn",
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-bold">Quản lý GOTA</h1>
          <div className="ml-auto flex items-center space-x-4">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
      <div className="flex flex-1">
        <aside className="hidden border-r bg-muted/40 md:block md:w-[200px] lg:w-[256px]">
          <SidebarNav />
        </aside>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 