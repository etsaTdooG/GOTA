"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChartIcon, CalendarIcon as Calendar, GearIcon, PersonIcon, ExitIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { ModeToggle } from "./ui/mode-toggle";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Calendar,
  },
  {
    name: "Charts",
    href: "/dashboard/charts",
    icon: BarChartIcon,
  },
  {
    name: "History",
    href: "/dashboard/history",
    icon: BarChartIcon,
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: PersonIcon,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: GearIcon,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border h-screen px-3 py-8">
      <div className="flex items-center mb-8 px-4">
        <img src="/logo.svg" alt="AN BBQ Logo" className="h-10 w-10 mr-2" />
        <div>
          <h1 className="font-bold text-lg text-primary">AN BBQ</h1>
          <p className="text-xs text-muted-foreground">Branch Su Van Hanh</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4 mr-3" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-1.5">
        <Link
          href="/logout"
          className="flex items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-destructive hover:text-destructive-foreground text-muted-foreground"
        >
          <ExitIcon className="h-4 w-4 mr-3" />
          Log Out
        </Link>
        <div className="flex justify-center mt-4">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
} 