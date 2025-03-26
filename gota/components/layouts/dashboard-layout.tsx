"use client";

import React, { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Skeleton component cho nội dung Dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div className="rounded-lg border bg-card">
        <div className="px-6 py-4 bg-primary/5">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="p-0">
          <div className="grid grid-cols-7 bg-muted/50">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center border-r border-b py-2">
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
          <div className="relative min-h-[500px]">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-64">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto animate-fade-in content-visibility-auto">
          <Suspense fallback={<DashboardSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
} 