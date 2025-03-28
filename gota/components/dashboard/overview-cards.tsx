import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CalendarDays, Clock, UtilityPole, TrendingUp, AlertCircle } from "lucide-react"

interface OverviewCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  className?: string
}

function OverviewCard({ title, value, description, icon, className }: OverviewCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface DashboardStats {
  total_reservations: number
  today_reservations: number
  pending_reservations: number
  cancelled_reservations: number
  total_customers: number
  today_customers: number
  average_rating: number
  total_reviews: number
  total_tables?: number
  available_tables?: number
}

export function OverviewCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <OverviewCard
        title="Tổng số đặt bàn"
        value={stats.total_reservations}
        description={`${stats.today_reservations} đặt bàn hôm nay`}
        icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
      />
      
      <OverviewCard
        title="Số khách hôm nay"
        value={stats.today_customers}
        description={`${stats.total_customers} tổng số khách`}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
      
      <OverviewCard
        title="Đánh giá trung bình"
        value={stats.average_rating.toFixed(1)}
        description={`${stats.total_reviews} đánh giá`}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      
      <OverviewCard
        title="Đặt bàn chờ xác nhận"
        value={stats.pending_reservations}
        description={`${stats.cancelled_reservations} đặt bàn đã hủy`}
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
      />
      
      {stats.total_tables !== undefined && (
        <OverviewCard
          title="Tổng số bàn"
          value={stats.total_tables}
          description={`${stats.available_tables || 0} bàn còn trống`}
          icon={<UtilityPole className="h-4 w-4 text-muted-foreground" />}
        />
      )}
    </div>
  )
}