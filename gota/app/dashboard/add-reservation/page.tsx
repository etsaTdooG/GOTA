"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

interface Restaurant {
  id: string
  name: string
}

export default function AddReservationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [numberOfPeople, setNumberOfPeople] = useState<string>("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [notes, setNotes] = useState("")
  const supabase = createClient()
  
  useEffect(() => {
    // Tải danh sách nhà hàng
    const fetchRestaurants = async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
      
      if (error) {
        toast.error('Không thể tải danh sách nhà hàng', {
          description: error.message
        })
        return
      }
      
      if (data && data.length > 0) {
        setRestaurants(data)
        setSelectedRestaurant(data[0].id)
      }
    }
    
    fetchRestaurants()
  }, [supabase])
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedRestaurant || !customerName || !phoneNumber || !numberOfPeople || !date || !time) {
      toast.error('Thiếu thông tin', {
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      // Tạo user mới nếu chưa có (trong thực tế cần xử lý đăng nhập)
      const tempEmail = email || `${phoneNumber}@temp.com`
      
      // Kiểm tra xem user đã tồn tại chưa
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', tempEmail)
        .limit(1)
      
      let userId = existingUsers?.[0]?.id
      
      if (!userId) {
        // Tạo user mới (trong thực tế cần xử lý đăng nhập, đây chỉ là demo)
        // Admin thực tế sẽ có API riêng để tạo đặt bàn không cần qua auth
        toast.error('Không thể tìm thấy người dùng', {
          description: 'Hệ thống chưa hỗ trợ tạo người dùng mới từ admin'
        })
        setIsLoading(false)
        return
      }
      
      // Thêm đặt bàn mới
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: userId,
          restaurant_id: selectedRestaurant,
          date: date,
          time: time,
          number_of_people: parseInt(numberOfPeople),
          notes: notes,
          status: 'confirmed' // Admin tạo đặt bàn sẽ tự động xác nhận
        })
        .select()
      
      if (error) {
        throw error
      }
      
      toast.success('Đã thêm đặt bàn thành công', {
        description: 'Đặt bàn đã được thêm vào hệ thống'
      })
      
      router.push("/dashboard/reservations")
    } catch (error: any) {
      toast.error('Lỗi', {
        description: error.message || 'Có lỗi xảy ra khi thêm đặt bàn'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Tạo mảng giờ đặt bàn
  const timeSlots = []
  for (let hour = 10; hour <= 21; hour++) {
    timeSlots.push(`${hour}:00`)
    timeSlots.push(`${hour}:30`)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/dashboard/reservations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Thêm đặt bàn mới</h2>
          <p className="text-muted-foreground">
            Thêm thông tin khách hàng và chi tiết đặt bàn.
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Thông tin đặt bàn</CardTitle>
          <CardDescription>
            Nhập thông tin chi tiết đặt bàn mới.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Tên khách hàng</Label>
                <Input 
                  id="customerName" 
                  placeholder="Nhập tên khách hàng" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input 
                  id="phoneNumber" 
                  placeholder="Nhập số điện thoại" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restaurant">Nhà hàng</Label>
                <Select 
                  value={selectedRestaurant} 
                  onValueChange={setSelectedRestaurant}
                  required
                >
                  <SelectTrigger id="restaurant">
                    <SelectValue placeholder="Chọn nhà hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfPeople">Số người</Label>
                <Select 
                  value={numberOfPeople} 
                  onValueChange={setNumberOfPeople}
                  required
                >
                  <SelectTrigger id="numberOfPeople">
                    <SelectValue placeholder="Chọn số người" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} người
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Ngày</Label>
                <div className="flex items-center">
                  <Input 
                    id="date" 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Giờ</Label>
                <Select 
                  value={time} 
                  onValueChange={setTime}
                  required
                >
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Chọn giờ" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea 
                id="notes" 
                placeholder="Nhập các yêu cầu đặc biệt hoặc ghi chú"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href="/dashboard/reservations">Hủy</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Thêm đặt bàn"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 