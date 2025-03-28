"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/utils/supabase/client"
import { User } from "@supabase/supabase-js"
import { toast } from "sonner"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  total_reservations: number
  last_reservation_date: string
  status: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()
  
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true)
      try {
        // Lấy danh sách người dùng
        const { data: users, error } = await supabase
          .from('users')
          .select('id, full_name, email, phone')
        
        if (error) throw error
        
        // Lấy thông tin đặt bàn cho mỗi người dùng
        const enhancedCustomers = await Promise.all(
          users.map(async (user) => {
            const { data: reservations, error: reservationError } = await supabase
              .from('reservations')
              .select('id, created_at, status')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
            
            if (reservationError) {
              console.error('Lỗi khi lấy đặt bàn:', reservationError)
              return {
                id: user.id,
                name: user.full_name || 'Không có tên',
                email: user.email || 'Không có email',
                phone: user.phone || 'Không có SĐT',
                total_reservations: 0,
                last_reservation_date: '',
                status: 'inactive'
              }
            }
            
            return {
              id: user.id,
              name: user.full_name || 'Không có tên',
              email: user.email || 'Không có email',
              phone: user.phone || 'Không có SĐT',
              total_reservations: reservations?.length || 0,
              last_reservation_date: reservations && reservations.length > 0 
                ? new Date(reservations[0].created_at).toLocaleDateString('vi-VN') 
                : '',
              status: reservations && reservations.length > 0 ? 'active' : 'inactive'
            }
          })
        )
        
        setCustomers(enhancedCustomers)
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu khách hàng:', error)
        toast.error('Không thể tải dữ liệu khách hàng', {
          description: 'Đã xảy ra lỗi khi tải dữ liệu'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCustomers()
  }, [supabase])
  
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Khách hàng</h2>
        <p className="text-muted-foreground">
          Quản lý danh sách khách hàng và xem lịch sử đặt bàn của họ.
        </p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center">
          <CardTitle>Danh sách khách hàng</CardTitle>
          <div className="ml-auto flex space-x-2">
            <Input
              placeholder="Tìm kiếm khách hàng..."
              className="w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button size="sm">Thêm khách hàng</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">Đang tải dữ liệu khách hàng...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Tổng số đặt bàn</TableHead>
                  <TableHead>Đặt bàn gần nhất</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Không tìm thấy khách hàng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.total_reservations}</TableCell>
                      <TableCell>{customer.last_reservation_date}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={customer.status === 'active' ? 'default' : 'outline'}
                          className={customer.status === 'active' ? 'bg-green-500' : ''}
                        >
                          {customer.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
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