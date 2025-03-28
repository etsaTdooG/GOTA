"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/ui/sidebar"
import { CalendarClock, BarChart3, Settings, Home, PlusCircle, FileText } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

const sidebarNavItems = [
  {
    title: "Tổng quan",
    href: "/dashboard",
    icon: Home
  },
  {
    title: "Lịch đặt bàn",
    href: "/dashboard/reservations",
    icon: CalendarClock
  },
  {
    title: "Thêm đặt bàn",
    href: "/dashboard/add-reservation",
    icon: PlusCircle
  },
  {
    title: "Thống kê",
    href: "/dashboard/statistics",
    icon: BarChart3
  },
  {
    title: "Cài đặt",
    href: "/dashboard/settings",
    icon: Settings
  },
]

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  className?: string
}

export function SidebarNav({ className, ...props }: SidebarNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = (href: string, title: string, e: React.MouseEvent) => {
    if (pathname !== href) {
      toast.info(`Đang chuyển đến: ${title}`, {
        description: `Bạn đang chuyển đến trang ${title.toLowerCase()}`,
        duration: 2000,
      })
    }
  }

  return (
    <Sidebar className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Quản lý nhà hàng</h2>
          <div className="space-y-1">
            {sidebarNavItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start",
                  pathname === item.href && "bg-muted"
                )}
                asChild
              >
                <Link 
                  href={item.href}
                  onClick={(e) => handleNavigation(item.href, item.title, e)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Sidebar>
  )
} 