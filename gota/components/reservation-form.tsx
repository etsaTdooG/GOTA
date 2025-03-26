"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Users, Phone, Mail, Info, Hash } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Khai báo kiểu dữ liệu cho form đặt bàn
interface ReservationData {
  name: string;
  phone: string;
  email?: string;
  time: string;
  date: Date;
  people: string;
  tableNo: string;
  notes?: string;
}

interface ReservationFormProps {
  onCancel: () => void;
  onSubmit: (data: ReservationData) => void;
}

// Tạo danh sách giờ đặt bàn - từ 10:00 đến 22:00
const TIME_SLOTS = Array.from({ length: 25 }).map((_, index) => {
  const hour = Math.floor(index / 2) + 10;
  const minute = index % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
}).filter((_, index) => index < 25); // Giới hạn đến 22:00

// NOTE: Khi tích hợp với Supabase, danh sách bàn sẽ được lấy từ bảng 'tables'
// Cần tạo bảng 'tables' với các trường sau:
// - id: UUID (primary key)
// - number: Text (số bàn)
// - capacity: Integer (sức chứa)
// - status: Text (available, reserved, maintenance)
// - location: Text (vị trí: window, center, outdoor, etc.)
const TABLES = [
  { id: "T01", capacity: 2, location: "Cửa sổ" },
  { id: "T02", capacity: 2, location: "Cửa sổ" },
  { id: "T03", capacity: 4, location: "Trong nhà" },
  { id: "T04", capacity: 4, location: "Trong nhà" },
  { id: "T05", capacity: 4, location: "Cửa sổ" },
  { id: "T06", capacity: 6, location: "Trong nhà" },
  { id: "T07", capacity: 6, location: "Ngoài trời" },
  { id: "T08", capacity: 8, location: "Trung tâm" },
  { id: "T09", capacity: 8, location: "Trung tâm" },
  { id: "T10", capacity: 10, location: "VIP" },
];

export function ReservationForm({ onCancel, onSubmit }: ReservationFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>("");
  const [people, setPeople] = useState<string>("");
  const [table, setTable] = useState<string>("");
  const [autoAssignTable, setAutoAssignTable] = useState(true);
  const [formState, setFormState] = useState({
    name: "",
    phone: "",
    email: "",
    note: ""
  });
  
  // Xử lý thay đổi input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState(prev => ({ ...prev, [id]: value }));
  }, []);

  // Lọc bàn phù hợp với số người
  const filteredTables = useCallback(() => {
    if (!people) return TABLES;
    const peopleCount = parseInt(people, 10);
    return TABLES.filter(table => table.capacity >= peopleCount && table.capacity <= peopleCount + 2);
  }, [people]);

  // Xử lý khi submit form
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra dữ liệu đầu vào
    if (!date || !time || !people || !formState.name || !formState.phone) {
      return; // Form validation failed
    }
    
    // Chuẩn bị dữ liệu để gửi
    const formData = {
      date,
      time,
      people,
      table: autoAssignTable ? "" : table,
      ...formState,
    };
    
    // Gọi callback onSubmit
    onSubmit(formData);
  }, [date, time, people, table, autoAssignTable, formState, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Ngày
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal transition-all hover:bg-primary/10",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "EEEE, dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
                locale={vi}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time" className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Giờ
          </Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger id="time" className="w-full transition-all hover:border-primary/50 hover:bg-primary/5">
              <SelectValue placeholder="Chọn giờ" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot} className="hover:bg-primary/10 cursor-pointer">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-primary" />
                    {slot}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="people" className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Số người
        </Label>
        <Select value={people} onValueChange={(value) => {
          setPeople(value);
          setTable(""); // Reset selected table when changing number of people
        }}>
          <SelectTrigger id="people" className="w-full transition-all hover:border-primary/50 hover:bg-primary/5">
            <SelectValue placeholder="Chọn số người" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((num) => (
              <SelectItem key={num} value={num.toString()} className="hover:bg-primary/10 cursor-pointer">
                {num} người
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="auto-assign" 
          checked={autoAssignTable} 
          onCheckedChange={(checked) => setAutoAssignTable(checked as boolean)}
        />
        <label
          htmlFor="auto-assign"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Tự động chọn bàn phù hợp
        </label>
      </div>

      {!autoAssignTable && (
        <div className="space-y-2">
          <Label htmlFor="table" className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            Bàn
          </Label>
          <Select 
            value={table} 
            onValueChange={setTable}
            disabled={!people || autoAssignTable}
          >
            <SelectTrigger id="table" className="w-full transition-all hover:border-primary/50 hover:bg-primary/5">
              <SelectValue placeholder="Chọn bàn" />
            </SelectTrigger>
            <SelectContent>
              {filteredTables().map((table) => (
                <SelectItem key={table.id} value={table.id} className="hover:bg-primary/10 cursor-pointer">
                  {table.id} - {table.capacity} người - {table.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Họ tên
        </Label>
        <Input 
          id="name" 
          required 
          placeholder="Nhập họ tên"
          value={formState.name}
          onChange={handleInputChange}
          className="transition-all hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            Số điện thoại
          </Label>
          <Input 
            id="phone" 
            required 
            placeholder="Nhập số điện thoại"
            value={formState.phone}
            onChange={handleInputChange}
            className="transition-all hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Email
          </Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="Nhập email"
            value={formState.email}
            onChange={handleInputChange}
            className="transition-all hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note" className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Ghi chú
        </Label>
        <Textarea
          id="note"
          placeholder="Nhập yêu cầu đặc biệt (nếu có)"
          className="resize-none min-h-[100px] transition-all hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
          value={formState.note}
          onChange={handleInputChange}
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
        >
          Hủy
        </Button>
        <Button 
          type="submit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          disabled={!date || !time || !people || !formState.name || !formState.phone || (!autoAssignTable && !table)}
        >
          Đặt bàn
        </Button>
      </div>
    </form>
  );
} 