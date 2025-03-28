"use client"

import { useEffect, useState } from "react"
import { Scheduler } from "@schedule-x/react"
import { defaultTheme as theme } from "@schedule-x/theme-default"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

interface Reservation {
  id: string
  title: string
  start: string
  end: string
  color: string
  status: string
}

interface CalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Calendar({ className, ...props }: CalendarProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true)
      try {
        // Lấy nhà hàng đầu tiên (trong thực tế sẽ có logic chọn nhà hàng)
        const { data: restaurants } = await supabase
          .from('restaurants')
          .select('id')
          .limit(1)
        
        const restaurantId = restaurants?.[0]?.id
        
        if (!restaurantId) {
          setReservations([])
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('reservations')
          .select(`
            id,
            profiles ( name, email ),
            date,
            time,
            number_of_people,
            status
          `)
          .eq('restaurant_id', restaurantId)
        
        if (error) {
          console.error('Lỗi khi tải dữ liệu đặt bàn:', error)
          toast.error('Không thể tải dữ liệu đặt bàn', {
            description: error.message
          })
          return
        }
        
        // Chuyển đổi dữ liệu từ Supabase sang định dạng calendar events
        const reservationEvents = data.map(reservation => {
          const startDate = new Date(`${reservation.date}T${reservation.time}`)
          const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // Thêm 2 tiếng
          
          // Chọn màu dựa trên trạng thái
          let color = '#22c55e' // Xanh lá - đã xác nhận (mặc định)
          if (reservation.status === 'pending') {
            color = '#f97316' // Cam - chờ xác nhận
          } else if (reservation.status === 'cancelled') {
            color = '#ef4444' // Đỏ - đã hủy
          }
          
          const userName = reservation.profiles?.name || reservation.profiles?.email || 'Khách hàng'
          
          return {
            id: reservation.id,
            title: `${userName} - ${reservation.number_of_people} người`,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            color: color,
            status: reservation.status
          }
        })
        
        setReservations(reservationEvents)
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu đặt bàn:', error)
        toast.error('Đã xảy ra lỗi', {
          description: 'Không thể tải dữ liệu đặt bàn'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchReservations()
  }, [supabase])

  const events = reservations.map(reservation => ({
    id: reservation.id,
    title: reservation.title,
    start: new Date(reservation.start),
    end: new Date(reservation.end),
    color: reservation.color,
    extendedProps: {
      status: reservation.status
    }
  }))

  const handleEventClick = (event: any) => {
    // Trong thực tế, sẽ chuyển hướng đến trang chi tiết đặt bàn
    toast.info(`Đã nhấp vào đặt bàn: ${event.title}`, {
      description: `ID: ${event.id} - Trạng thái: ${event.extendedProps.status}`,
      duration: 3000,
    })
  }

  return (
    <div className={cn("bg-background rounded-md border", className)} {...props}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Scheduler
          events={events}
          theme={theme}
          locale="vi"
          translations={{
            day: 'Ngày',
            week: 'Tuần',
            month: 'Tháng',
            today: 'Hôm nay',
          }}
          onEventClick={handleEventClick}
          initialView="week"
          height="600px"
          customButtons={[
            {
              name: 'add-reservation',
              text: 'Thêm đặt bàn',
              onClick: () => {
                window.location.href = '/dashboard/add-reservation'
              }
            }
          ]}
        />
      )}
    </div>
  )
} 