"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success("Cài đặt đã được lưu", {
        description: "Các cài đặt của bạn đã được cập nhật thành công",
      })
    } catch (error) {
      toast.error("Lỗi", {
        description: "Có lỗi xảy ra khi lưu cài đặt",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cài đặt</h2>
        <p className="text-muted-foreground">
          Quản lý cài đặt nhà hàng và hệ thống đặt bàn.
        </p>
      </div>
      
      <Tabs defaultValue="restaurant" className="space-y-4">
        <TabsList>
          <TabsTrigger value="restaurant">Nhà hàng</TabsTrigger>
          <TabsTrigger value="reservation">Đặt bàn</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="restaurant" className="space-y-4">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Thông tin nhà hàng</CardTitle>
                <CardDescription>
                  Cập nhật thông tin cơ bản về nhà hàng của bạn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-name">Tên nhà hàng</Label>
                    <Input id="restaurant-name" defaultValue="AN BBQ Restaurant" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-phone">Số điện thoại</Label>
                    <Input id="restaurant-phone" defaultValue="0123456789" required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="restaurant-address">Địa chỉ</Label>
                    <Input id="restaurant-address" defaultValue="123 Đường ABC, Quận 1, TP.HCM" required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="restaurant-description">Mô tả</Label>
                    <Textarea 
                      id="restaurant-description" 
                      defaultValue="AN BBQ là nhà hàng đồ nướng Hàn Quốc với các món ăn đặc trưng và không gian thoải mái." 
                      required 
                      className="resize-none min-h-[100px]"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Giờ mở cửa</CardTitle>
              <CardDescription>
                Thiết lập giờ mở cửa cho từng ngày trong tuần.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"].map((day) => (
                  <div key={day} className="flex items-center justify-between">
                    <Label>{day}</Label>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Input type="time" defaultValue="10:00" className="w-24" />
                        <span>-</span>
                        <Input type="time" defaultValue="22:00" className="w-24" />
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button>Lưu thay đổi</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="reservation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt đặt bàn</CardTitle>
              <CardDescription>
                Quản lý cách thức đặt bàn hoạt động.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thời gian đặt trước tối thiểu</Label>
                    <p className="text-sm text-muted-foreground">
                      Khách hàng phải đặt bàn trước bao nhiêu giờ
                    </p>
                  </div>
                  <Input type="number" defaultValue="2" className="w-20" />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thời gian đặt bàn tối đa</Label>
                    <p className="text-sm text-muted-foreground">
                      Khách hàng có thể đặt bàn trước bao nhiêu ngày
                    </p>
                  </div>
                  <Input type="number" defaultValue="30" className="w-20" />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thời gian mỗi lượt</Label>
                    <p className="text-sm text-muted-foreground">
                      Thời gian dự kiến cho mỗi lượt đặt bàn (phút)
                    </p>
                  </div>
                  <Input type="number" defaultValue="120" className="w-20" />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Yêu cầu xác nhận thủ công</Label>
                    <p className="text-sm text-muted-foreground">
                      Yêu cầu admin xác nhận thủ công mỗi lần đặt bàn
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Lưu thay đổi</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt thông báo</CardTitle>
              <CardDescription>
                Quản lý cách thông báo được gửi đến khách hàng và nhân viên.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thông báo xác nhận đặt bàn</Label>
                    <p className="text-sm text-muted-foreground">
                      Gửi email xác nhận khi khách hàng đặt bàn
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thông báo nhắc nhở</Label>
                    <p className="text-sm text-muted-foreground">
                      Gửi nhắc nhở trước khi đến giờ đặt bàn
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thông báo hủy đặt bàn</Label>
                    <p className="text-sm text-muted-foreground">
                      Gửi thông báo khi đặt bàn bị hủy
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thông báo cho nhân viên</Label>
                    <p className="text-sm text-muted-foreground">
                      Gửi thông báo cho nhân viên khi có đặt bàn mới
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Lưu thay đổi</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 