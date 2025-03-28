import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarClock, Users, TrendingUp, AlertCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { formatDate } from "@/lib/utils"

interface DashboardStats {
  total_reservations: number
  today_reservations: number
  pending_reservations: number
  cancelled_reservations: number
  total_customers: number
  today_customers: number
  average_rating: number
  total_reviews: number
}

interface RecentReservation {
  id: string
  user_name: string
  number_of_people: number
  date: string
  time: string
  status: string
  notes: string | null
}

export default async function DashboardPage() {
  const supabase = createClient()
  
  // Lấy thông tin nhà hàng đầu tiên (trong thực tế sẽ có logic chọn nhà hàng)
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id')
    .limit(1)
  
  const restaurantId = restaurants?.[0]?.id
  
  // Khởi tạo giá trị mặc định
  let stats: DashboardStats = {
    total_reservations: 0,
    today_reservations: 0,
    pending_reservations: 0,
    cancelled_reservations: 0,
    total_customers: 0,
    today_customers: 0,
    average_rating: 0,
    total_reviews: 0
  }
  
  let recentReservations: RecentReservation[] = []
  let specialRequests: RecentReservation[] = []
  
  if (restaurantId) {
    // Lấy thống kê tổng hợp
    const today = new Date().toISOString().split('T')[0]
    
    // Lấy tổng số đặt bàn
    const { count: totalReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
    
    // Lấy số đặt bàn hôm nay
    const { count: todayReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('date', today)
    
    // Lấy số đặt bàn đang chờ xử lý
    const { count: pendingReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')
    
    // Lấy số đặt bàn bị hủy
    const { count: cancelledReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('status', 'cancelled')
    
    // Lấy tổng số khách
    const { data: totalCustomersData } = await supabase
      .from('reservations')
      .select('number_of_people')
      .eq('restaurant_id', restaurantId)
    
    const totalCustomers = totalCustomersData?.reduce((sum, r) => sum + r.number_of_people, 0) || 0
    
    // Lấy số khách hôm nay
    const { data: todayCustomersData } = await supabase
      .from('reservations')
      .select('number_of_people')
      .eq('restaurant_id', restaurantId)
      .eq('date', today)
    
    const todayCustomers = todayCustomersData?.reduce((sum, r) => sum + r.number_of_people, 0) || 0
    
    // Lấy thông tin đánh giá
    const { data: restaurantData } = await supabase
      .from('restaurants')
      .select('average_rating, total_reviews')
      .eq('id', restaurantId)
      .single()
    
    stats = {
      total_reservations: totalReservations || 0,
      today_reservations: todayReservations || 0,
      pending_reservations: pendingReservations || 0,
      cancelled_reservations: cancelledReservations || 0,
      total_customers: totalCustomers,
      today_customers: todayCustomers,
      average_rating: restaurantData?.average_rating || 0,
      total_reviews: restaurantData?.total_reviews || 0
    }
    
    // Lấy đặt bàn gần đây
    const { data: recentData } = await supabase
      .from('reservations')
      .select(`
        id,
        profiles (name, email),
        number_of_people,
        date,
        time,
        status,
        notes
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (recentData) {
      recentReservations = recentData.map(r => ({
        id: r.id,
        user_name: r.profiles?.name || r.profiles?.email || 'Khách hàng',
        number_of_people: r.number_of_people,
        date: r.date,
        time: r.time,
        status: r.status,
        notes: r.notes
      }))
    }
    
    // Lấy các đặt bàn có ghi chú đặc biệt
    const { data: specialData } = await supabase
      .from('reservations')
      .select(`
        id,
        profiles (name, email),
        number_of_people,
        date,
        time,
        status,
        notes
      `)
      .eq('restaurant_id', restaurantId)
      .not('notes', 'is', null)
      .order('date', { ascending: true })
      .limit(5)
    
    if (specialData) {
      specialRequests = specialData.map(r => ({
        id: r.id,
        user_name: r.profiles?.name || r.profiles?.email || 'Khách hàng',
        number_of_people: r.number_of_people,
        date: r.date,
        time: r.time,
        status: r.status,
        notes: r.notes
      }))
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500'
      case 'pending': return 'bg-orange-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận'
      case 'pending': return 'Chờ xác nhận'
      case 'cancelled': return 'Đã hủy'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tổng quan</h2>
        <p className="text-muted-foreground">
          Tổng quan về đặt bàn và hoạt động của nhà hàng.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số đặt bàn
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_reservations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.today_reservations} đặt bàn hôm nay
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Số khách hôm nay
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today_customers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.today_reservations} bàn đã đặt
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đánh giá trung bình
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_reviews} đánh giá
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chờ xác nhận
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_reservations}</div>
            <p className="text-xs text-muted-foreground">
              Cần xử lý
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Đặt bàn gần đây</CardTitle>
            <CardDescription>
              Các đặt bàn mới nhất.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReservations.length > 0 ? (
              recentReservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between space-x-4">
                  <div>
                    <p className="text-sm font-medium">{reservation.user_name} - {reservation.number_of_people} người</p>
                    <p className="text-xs text-muted-foreground">{formatDate(reservation.date)}, {reservation.time}</p>
                  </div>
                  <Badge className={getStatusColor(reservation.status)}>{getStatusText(reservation.status)}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Không có đặt bàn gần đây</p>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/reservations">
                Xem tất cả
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Yêu cầu đặc biệt</CardTitle>
            <CardDescription>
              Các yêu cầu cần chú ý cho đặt bàn sắp tới.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {specialRequests.length > 0 ? (
              specialRequests.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between space-x-4">
                  <div>
                    <p className="text-sm font-medium">{reservation.user_name} - {reservation.number_of_people} người</p>
                    <p className="text-xs text-muted-foreground">{formatDate(reservation.date)}, {reservation.time}</p>
                  </div>
                  <p className="text-xs max-w-[150px] truncate" title={reservation.notes || ""}>
                    {reservation.notes}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Không có yêu cầu đặc biệt</p>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/reservations">
                Xem tất cả
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 