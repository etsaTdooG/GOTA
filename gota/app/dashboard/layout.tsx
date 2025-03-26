import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export const metadata = {
  title: "Dashboard - Gota",
  description: "Hệ thống quản lý và đặt bàn nhà hàng",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 