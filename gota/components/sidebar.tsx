"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  CalendarDays, 
  LineChart, 
  LogOut,
  Home,
  Utensils
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Trang chủ",
      href: "/",
      icon: Home
    },
    {
      name: "Lịch đặt bàn",
      href: "/dashboard",
      icon: CalendarDays
    },
    {
      name: "Thống kê",
      href: "/dashboard/charts",
      icon: LineChart
    }
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border shadow-md">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6 bg-primary/5">
        <Link href="/" className="flex items-center gap-2 font-semibold transition-transform hover:scale-105">
          <Utensils className="h-5 w-5 text-primary" />
          <span className="text-sidebar-primary text-2xl">GOTA</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-auto p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent/20 hover:translate-x-1",
                        isActive && "bg-sidebar-accent/30 text-sidebar-primary font-medium"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                      <span>{item.name}</span>
                      {isActive && <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-md" />}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border p-4 bg-primary/5">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
          <ModeToggle />
        </div>
      </div>
    </aside>
  );
} 