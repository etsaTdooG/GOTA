"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddRestaurantPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    cuisine_type: "",
    open_time: "08:00",
    close_time: "22:00",
    description: "",
    is_active: true,
    image_url: ""
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Kiểm tra thông tin bắt buộc
      if (!formData.name || !formData.address || !formData.phone) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc', {
          description: 'Tên, địa chỉ và số điện thoại là bắt buộc'
        })
        return
      }
      
      // Thêm nhà hàng vào Supabase
      const { data, error } = await supabase
        .from('restaurants')
        .insert([
          {
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            cuisine_type: formData.cuisine_type,
            open_time: formData.open_time,
            close_time: formData.close_time,
            description: formData.description,
            is_active: formData.is_active,
            image_url: formData.image_url,
            average_rating: 0
          }
        ])
        .select()
      
      if (error) throw error
      
      toast.success('Thêm nhà hàng thành công', {
        description: `Đã thêm nhà hàng ${formData.name}`
      })
      
      // Chuyển hướng đến trang danh sách nhà hàng
      router.push('/dashboard/restaurants')
    } catch (error) {
      console.error('Lỗi khi thêm nhà hàng:', error)
      toast.error('Không thể thêm nhà hàng', {
        description: 'Đã xảy ra lỗi khi thêm nhà hàng'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Thêm nhà hàng mới</h2>
        <p className="text-muted-foreground">
          Điền thông tin để thêm nhà hàng mới vào hệ thống.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Thông tin nhà hàng</CardTitle>
            <CardDescription>
              Nhập thông tin chi tiết về nhà hàng.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên nhà hàng <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nhập tên nhà hàng"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ <span className="text-red-500">*</span></Label>
              <Input
                id="address"
                name="address"
                placeholder="Nhập địa chỉ nhà hàng"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Nhập mô tả về nhà hàng"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cuisine_type">Loại ẩm thực</Label>
                <Select
                  value={formData.cuisine_type}
                  onValueChange={(value) => handleSelectChange('cuisine_type', value)}
                >
                  <SelectTrigger id="cuisine_type">
                    <SelectValue placeholder="Chọn loại ẩm thực" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vietnamese">Việt Nam</SelectItem>
                    <SelectItem value="japanese">Nhật Bản</SelectItem>
                    <SelectItem value="korean">Hàn Quốc</SelectItem>
                    <SelectItem value="chinese">Trung Hoa</SelectItem>
                    <SelectItem value="italian">Ý</SelectItem>
                    <SelectItem value="french">Pháp</SelectItem>
                    <SelectItem value="american">Mỹ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image_url">URL hình ảnh</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  placeholder="Nhập URL hình ảnh nhà hàng"
                  value={formData.image_url}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="open_time">Giờ mở cửa</Label>
                <Input
                  id="open_time"
                  name="open_time"
                  type="time"
                  value={formData.open_time}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="close_time">Giờ đóng cửa</Label>
                <Input
                  id="close_time"
                  name="close_time"
                  type="time"
                  value={formData.close_time}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Nhà hàng đang hoạt động</Label>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/restaurants')}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Thêm nhà hàng'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 