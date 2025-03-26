"use client";

import { useState, useTransition } from "react";
import { Bell, User, Search, ChevronDown } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DashboardHeader() {
  const [searchValue, setSearchValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    startTransition(() => {
      // Debounced search logic would go here
      console.log('Searching for:', value);
    });
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm kiếm..."
          className="w-full pl-8 transition-all focus:ring-2 focus:ring-primary/20"
          value={searchValue}
          onChange={handleSearch}
          aria-label="Tìm kiếm"
        />
        {isPending && <div className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
      <div className="flex items-center gap-4">
        <Button 
          size="icon" 
          variant="ghost" 
          className="rounded-full relative hover:bg-primary/10 transition-colors"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive animate-pulse"></span>
        </Button>
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 hover:bg-primary/10 transition-colors"
              aria-label="Menu tài khoản"
            >
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src="/avatars/admin.jpg" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-muted-foreground">admin@gota.vn</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer hover:bg-primary/10">
              <User className="mr-2 h-4 w-4" />
              <span>Hồ sơ</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-primary/10">
              <Bell className="mr-2 h-4 w-4" />
              <span>Thông báo</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-primary/10">
              <Search className="mr-2 h-4 w-4" />
              <span>Hoạt động</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10">
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
} 