"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

interface Reservation {
  id: string
  user_id: string
  restaurant_id: string
  restaurant_name: string
  customer_name: string
  date: string
  time: string
  number_of_people: number
  status: string
  notes: string
  created_at: string
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()
  
  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true)
      try {
        // Lấy thông tin đặt bàn
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select(`
            id, 
            user_id,
            restaurant_id,
            date,
            time,
            number_of_people,
            status,
            notes,
            created_at
          `)
          .order('created_at', { ascending: false })
        
        if (reservationsError) throw reservationsError
        
        if (!reservationsData || reservationsData.length === 0) {
          setReservations([])
          setIsLoading(false)
          return
        }
        
        // Lấy thông tin người dùng và nhà hàng
        const enhancedReservations = await Promise.all(
          reservationsData.map(async (reservation) => {
            // Lấy thông tin người dùng
            const { data: userData } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', reservation.user_id)
              .single()
            
            // Lấy thông tin nhà hàng
            const { data: restaurantData } = await supabase
              .from('restaurants')
              .select('name')
              .eq('id', reservation.restaurant_id)
              .single()
            
            return {
              ...reservation,
              customer_name: userData?.full_name || 'Không có tên',
              restaurant_name: restaurantData?.name || 'Không có tên'
            }
          })
        )
        
        setReservations(enhancedReservations)
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu đặt bàn:', error)
        toast.error('Không thể tải dữ liệu đặt bàn', {
          description: 'Đã xảy ra lỗi khi tải dữ liệu'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchReservations()
  }, [supabase])
  
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) throw error
      
      // Cập nhật trạng thái trong danh sách
      setReservations(prevReservations => 
        prevReservations.map(reservation => 
          reservation.id === id ? { ...reservation, status: newStatus } : reservation
        )
      )
      
      toast.success('Cập nhật trạng thái thành công', {
        description: `Trạng thái đặt bàn đã được cập nhật thành ${newStatus}`
      })
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error)
      toast.error('Không thể cập nhật trạng thái', {
        description: 'Đã xảy ra lỗi khi cập nhật trạng thái'
      })
    }
  }
  
  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.status.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Đặt bàn</h2>
        <p className="text-muted-foreground">
          Quản lý đặt bàn và xem lịch sử đặt bàn.
        </p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center">
          <CardTitle>Danh sách đặt bàn</CardTitle>
          <div className="ml-auto flex space-x-2">
            <Input
              placeholder="Tìm kiếm đặt bàn..."
              className="w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button size="sm" asChild>
              <Link href="/dashboard/add-reservation">Thêm đặt bàn</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">Đang tải dữ liệu đặt bàn...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Nhà hàng</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Giờ</TableHead>
                  <TableHead>Số người</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Tùy chọn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Không tìm thấy đặt bàn nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">{reservation.customer_name}</TableCell>
                      <TableCell>{reservation.restaurant_name}</TableCell>
                      <TableCell>{new Date(reservation.date).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>{reservation.time}</TableCell>
                      <TableCell>{reservation.number_of_people}</TableCell>
                      <TableCell>
                        {getStatusBadge(reservation.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Mở menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                              disabled={reservation.status === 'confirmed'}
                            >
                              Xác nhận
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                              disabled={reservation.status === 'cancelled'}
                            >
                              Hủy đặt bàn
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(reservation.id, 'completed')}
                              disabled={reservation.status === 'completed'}
                            >
                              Đánh dấu hoàn thành
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 