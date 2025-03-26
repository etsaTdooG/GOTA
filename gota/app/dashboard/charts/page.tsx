"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { ArrowUpRight, BarChart3, CalendarDays, TrendingUp, Users } from "lucide-react";

// NOTE: Khi tích hợp với Supabase, dữ liệu thống kê sẽ được lấy từ API
// Cần tạo các queries để tính toán số liệu thống kê từ các bảng dữ liệu

// Dữ liệu thống kê lượt đặt bàn theo ngày trong tuần
const weeklyData = [
  { name: 'Thứ 2', value: 12 },
  { name: 'Thứ 3', value: 19 },
  { name: 'Thứ 4', value: 15 },
  { name: 'Thứ 5', value: 28 },
  { name: 'Thứ 6', value: 35 },
  { name: 'Thứ 7', value: 42 },
  { name: 'CN', value: 31 },
];

// Dữ liệu thống kê lượt đặt bàn theo tháng
const monthlyData = [
  { name: 'T1', value: 120 },
  { name: 'T2', value: 135 },
  { name: 'T3', value: 150 },
  { name: 'T4', value: 180 },
  { name: 'T5', value: 210 },
  { name: 'T6', value: 245 },
  { name: 'T7', value: 280 },
  { name: 'T8', value: 310 },
  { name: 'T9', value: 290 },
  { name: 'T10', value: 320 },
  { name: 'T11', value: 300 },
  { name: 'T12', value: 350 },
];

// Dữ liệu thống kê theo trạng thái đặt bàn
const statusData = [
  { name: 'Đã xác nhận', value: 65, color: '#4ade80' },
  { name: 'Chờ xác nhận', value: 25, color: '#facc15' },
  { name: 'Đã hủy', value: 10, color: '#f87171' },
];

// Dữ liệu thống kê đặt bàn theo thời gian trong ngày
const timeData = [
  { name: '10:00', value: 5 },
  { name: '11:00', value: 8 },
  { name: '12:00', value: 18 },
  { name: '13:00', value: 15 },
  { name: '14:00', value: 10 },
  { name: '15:00', value: 7 },
  { name: '16:00', value: 6 },
  { name: '17:00', value: 9 },
  { name: '18:00', value: 22 },
  { name: '19:00', value: 25 },
  { name: '20:00', value: 20 },
  { name: '21:00', value: 12 },
  { name: '22:00', value: 8 },
];

// Dữ liệu thống kê KPIs
const kpiData = [
  { 
    title: "Tổng đặt bàn", 
    value: 1250, 
    change: "+12.5%", 
    isIncrease: true,
    icon: CalendarDays,
    description: "So với tháng trước" 
  },
  { 
    title: "Khách hàng mới", 
    value: 354, 
    change: "+8.2%", 
    isIncrease: true,
    icon: Users,
    description: "So với tháng trước" 
  },
  { 
    title: "Tỷ lệ lấp đầy", 
    value: "78%", 
    change: "+5.1%", 
    isIncrease: true,
    icon: BarChart3,
    description: "So với tháng trước" 
  },
  { 
    title: "Tăng trưởng", 
    value: "15.2%", 
    change: "+2.3%", 
    isIncrease: true,
    icon: TrendingUp,
    description: "So với tháng trước" 
  },
];

export default function ChartsPage() {
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly">("weekly");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thống kê</h1>
          <p className="text-muted-foreground">
            Xem báo cáo và thống kê về hoạt động đặt bàn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs defaultValue={timeRange} onValueChange={(v) => setTimeRange(v as "weekly" | "monthly")}>
            <TabsList>
              <TabsTrigger value="weekly">Tuần</TabsTrigger>
              <TabsTrigger value="monthly">Tháng</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline">
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">
                {kpi.isIncrease ? (
                  <span className="text-green-500 flex items-center">
                    <ArrowUpRight className="mr-1 h-4 w-4" />
                    {kpi.change}
                  </span>
                ) : (
                  <span className="text-red-500">{kpi.change}</span>
                )}
                {" "}{kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Lượt đặt bàn theo {timeRange === "weekly" ? "ngày" : "tháng"}</CardTitle>
            <CardDescription>
              Biểu đồ thống kê số lượt đặt bàn theo {timeRange === "weekly" ? "ngày trong tuần" : "tháng trong năm"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={timeRange === "weekly" ? weeklyData : monthlyData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Số lượt đặt bàn" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Trạng thái đặt bàn</CardTitle>
            <CardDescription>
              Phân bổ trạng thái của các lượt đặt bàn
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Time Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Phân bổ đặt bàn theo giờ</CardTitle>
          <CardDescription>
            Thống kê số lượt đặt bàn theo khung giờ trong ngày
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={timeData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name="Số lượt đặt bàn"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Notes for Supabase Integration */}
      {/* 
        NOTE: Khi tích hợp với Supabase, cần xây dựng các queries sau:

        1. Thống kê tổng đặt bàn và % thay đổi so với tháng trước:
           - Query số lượng đặt bàn trong tháng hiện tại
           - Query số lượng đặt bàn trong tháng trước
           - Tính % thay đổi

        2. Thống kê khách hàng mới:
           - Query số lượng khách hàng mới trong tháng (khách hàng đặt bàn lần đầu)
           - Query số lượng khách hàng mới trong tháng trước
           - Tính % thay đổi

        3. Thống kê tỷ lệ lấp đầy:
           - Query tổng số bàn đã được đặt / tổng số bàn có sẵn * 100%
           - Query tỷ lệ tương tự của tháng trước
           - Tính % thay đổi

        4. Thống kê theo ngày/tháng:
           - Query số lượng đặt bàn được nhóm theo ngày trong tuần / tháng trong năm

        5. Thống kê theo trạng thái:
           - Query số lượng đặt bàn được nhóm theo trạng thái (confirmed, pending, cancelled)

        6. Thống kê theo giờ:
           - Query số lượng đặt bàn được nhóm theo giờ trong ngày
      */}
    </div>
  );
} 