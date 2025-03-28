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

interface Restaurant {
  id: string
  name: string
  address: string
  phone: string
  cuisine_type: string
  open_time: string
  close_time: string
  average_rating: number
  is_active: boolean
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()
  
  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
        
        if (error) throw error
        
        setRestaurants(data || [])
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu nhà hàng:', error)
        toast.error('Không thể tải dữ liệu nhà hàng', {
          description: 'Đã xảy ra lỗi khi tải dữ liệu'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRestaurants()
  }, [supabase])
  
  const filteredRestaurants = restaurants.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nhà hàng</h2>
        <p className="text-muted-foreground">
          Quản lý danh sách nhà hàng và thông tin chi tiết.
        </p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center">
          <CardTitle>Danh sách nhà hàng</CardTitle>
          <div className="ml-auto flex space-x-2">
            <Input
              placeholder="Tìm kiếm nhà hàng..."
              className="w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button size="sm" asChild>
              <Link href="/dashboard/add-restaurant">Thêm nhà hàng</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">Đang tải dữ liệu nhà hàng...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên nhà hàng</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Loại ẩm thực</TableHead>
                  <TableHead>Giờ mở cửa</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Không tìm thấy nhà hàng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRestaurants.map((restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell className="font-medium">{restaurant.name}</TableCell>
                      <TableCell>{restaurant.address}</TableCell>
                      <TableCell>{restaurant.cuisine_type}</TableCell>
                      <TableCell>{restaurant.open_time} - {restaurant.close_time}</TableCell>
                      <TableCell>
                        {restaurant.average_rating ? restaurant.average_rating.toFixed(1) : 'Chưa có'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={restaurant.is_active ? 'default' : 'outline'}
                          className={restaurant.is_active ? 'bg-green-500' : ''}
                        >
                          {restaurant.is_active ? 'Hoạt động' : 'Tạm ngưng'}
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