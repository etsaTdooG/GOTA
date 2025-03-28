"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

interface StatisticsData {
  totalReservations: number
  confirmedReservations: number
  pendingReservations: number
  cancelledReservations: number
  totalCustomers: number
  fillRate: number
  averageRating: number
  cancellationRate: number
}

export default function StatisticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<StatisticsData>({
    totalReservations: 0,
    confirmedReservations: 0,
    pendingReservations: 0,
    cancelledReservations: 0,
    totalCustomers: 0,
    fillRate: 0,
    averageRating: 0,
    cancellationRate: 0
  })
  const supabase = createClient()
  
  useEffect(() => {
    const fetchStatistics = async () => {
      setIsLoading(true)
      try {
        // Lấy nhà hàng đầu tiên (trong thực tế sẽ có logic chọn nhà hàng)
        const { data: restaurants } = await supabase
          .from('restaurants')
          .select('id, average_rating')
          .limit(1)
        
        const restaurantId = restaurants?.[0]?.id
        
        if (!restaurantId) {
          setIsLoading(false)
          return
        }
        
        // Lấy thống kê đặt bàn
        const { data: reservationsData } = await supabase
          .from('reservations')
          .select('id, status, number_of_people')
          .eq('restaurant_id', restaurantId)
        
        if (!reservationsData) {
          setIsLoading(false)
          return
        }
        
        const totalReservations = reservationsData.length
        const confirmedReservations = reservationsData.filter(r => r.status === 'confirmed').length
        const pendingReservations = reservationsData.filter(r => r.status === 'pending').length
        const cancelledReservations = reservationsData.filter(r => r.status === 'cancelled').length
        const totalCustomers = reservationsData.reduce((sum, r) => sum + r.number_of_people, 0)
        
        // Tính các chỉ số
        const fillRate = totalReservations > 0 ? (confirmedReservations / totalReservations) * 100 : 0
        const cancellationRate = totalReservations > 0 ? (cancelledReservations / totalReservations) * 100 : 0
        
        setStats({
          totalReservations,
          confirmedReservations,
          pendingReservations,
          cancelledReservations,
          totalCustomers,
          fillRate,
          averageRating: restaurants[0].average_rating || 0,
          cancellationRate
        })
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu thống kê:', error)
        toast.error('Không thể tải dữ liệu thống kê', {
          description: 'Đã xảy ra lỗi khi tải dữ liệu'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStatistics()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Thống kê</h2>
        <p className="text-muted-foreground">
          Phân tích dữ liệu đặt bàn và đánh giá của nhà hàng.
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="reservations">Đặt bàn</TabsTrigger>
          <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tổng số đặt bàn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReservations}</div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Đang tải..." : `${stats.confirmedReservations} đã xác nhận`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tỷ lệ lấp đầy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.fillRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Đang tải..." : `${stats.confirmedReservations}/${stats.totalReservations} đặt bàn`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Đánh giá trung bình
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Đang tải..." : `Trên thang điểm 5`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tỷ lệ hủy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cancellationRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Đang tải..." : `${stats.cancelledReservations} đặt bàn bị hủy`}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố đặt bàn theo giờ</CardTitle>
                <CardDescription>
                  Số lượng đặt bàn theo các khung giờ trong tuần.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">Biểu đồ đang được phát triển</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Số lượng đặt bàn theo ngày</CardTitle>
                <CardDescription>
                  Số lượng đặt bàn trong 30 ngày qua.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">Biểu đồ đang được phát triển</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phân tích đặt bàn</CardTitle>
              <CardDescription>
                Chi tiết về xu hướng đặt bàn và tỷ lệ chuyển đổi.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground">Biểu đồ đang được phát triển</div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phân tích đánh giá</CardTitle>
              <CardDescription>
                Chi tiết về đánh giá của khách hàng.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground">Biểu đồ đang được phát triển</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 