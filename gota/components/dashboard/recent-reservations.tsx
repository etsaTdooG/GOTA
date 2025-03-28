import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface RecentReservation {
  id: string
  user_name: string
  number_of_people: number
  date: string
  time: string
  status: string
  notes: string | null
}

export function RecentReservations({ 
  reservations, 
  title = "Đặt bàn gần đây",
  emptyMessage = "Không có đặt bàn nào gần đây"
}: { 
  reservations: RecentReservation[], 
  title?: string,
  emptyMessage?: string
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Đã xác nhận</Badge>
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Chờ xác nhận</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="text-red-500 border-red-500">Đã hủy</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Hoàn thành</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div 
                key={reservation.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(reservation.user_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{reservation.user_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(reservation.date)} • {reservation.time} • {reservation.number_of_people} người
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(reservation.status)}
                  <Link 
                    href={`/dashboard/reservations/${reservation.id}`} 
                    className="text-xs text-primary hover:underline"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <Link 
                href="/dashboard/reservations" 
                className="text-sm text-primary hover:underline"
              >
                Xem tất cả đặt bàn
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}