import React from "react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Chào mừng đến với ứng dụng của tôi</h1>
        <ModeToggle />
      </header>
      <main>
        <p className="text-muted-foreground mb-6">
          Đây là một ứng dụng Next.js sử dụng Shadcn UI với chế độ tối.
        </p>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Các trang trong ứng dụng:</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="text-primary hover:underline">
                Dashboard - Quản lý đặt bàn
              </Link>
            </li>
          </ul>
          
          <Button asChild className="mt-6">
            <Link href="/dashboard">
              Đi đến Dashboard
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
