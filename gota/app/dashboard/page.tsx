"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { format, startOfWeek, addDays, isToday, isSameDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Plus, ChevronDown, Calendar, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ReservationForm } from "@/components/reservation-form";
import { cn } from "@/lib/utils";
import DashboardLoading from "./loading";

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

// MOCK DATA: Sẽ được thay thế bằng dữ liệu từ Supabase
// NOTE: Đây là cấu trúc dữ liệu mẫu để tích hợp với Supabase sau này
// Cần tạo bảng 'reservations' với các trường sau:
// - id: UUID (primary key)
// - name: Text (tên khách hàng)
// - phone: Text (số điện thoại)
// - email: Text (email, optional)
// - date: Date (ngày đặt bàn)
// - time: Text (giờ đặt bàn, format HH:MM)
// - people: Integer (số người)
// - table: Text (số bàn, nếu có)
// - note: Text (ghi chú, optional)
// - status: Text (trạng thái: confirmed, pending, cancelled)
// - created_at: Timestamp (thời gian tạo)
const mockReservations = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    phone: "0912345678",
    email: "nguyenvana@example.com",
    time: "12:00",
    date: "2023-03-23",
    people: 4,
    table: "T01",
    note: "Gần cửa sổ",
    status: "confirmed", 
    created_at: "2023-03-22T09:00:00Z"
  },
  {
    id: "2",
    name: "Trần Văn B",
    phone: "0987654321",
    email: "tranvanb@example.com",
    time: "18:30",
    date: "2023-03-23",
    people: 2,
    table: "T05",
    note: "",
    status: "confirmed",
    created_at: "2023-03-22T10:30:00Z"
  },
  {
    id: "3",
    name: "Lê Thị C",
    phone: "0977123456",
    email: "lethic@example.com",
    time: "19:00",
    date: "2023-03-23",
    people: 6,
    table: "T10",
    note: "Có trẻ em",
    status: "pending",
    created_at: "2023-03-22T14:15:00Z"
  },
  {
    id: "4",
    name: "Phạm Văn D",
    phone: "0909123456",
    email: "phamvand@example.com",
    time: "20:00",
    date: "2023-03-24",
    people: 3,
    table: "T03",
    note: "",
    status: "confirmed",
    created_at: "2023-03-22T16:45:00Z"
  },
  {
    id: "5",
    name: "Hoàng Thị E",
    phone: "0898123456",
    email: "hoangthie@example.com",
    time: "19:30",
    date: "2023-03-25",
    people: 4,
    table: "T08",
    note: "Kỷ niệm ngày cưới",
    status: "confirmed",
    created_at: "2023-03-23T08:20:00Z"
  }
];

// Các khung giờ có thể đặt bàn
const timeSlots = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", 
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", 
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"
];

// Component tùy chỉnh cho Toast thành công
const SuccessToast = ({ tableNo, people, time, date }: { tableNo: string, people: number, time: string, date: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 font-medium">
        <Check className="h-5 w-5 text-green-500" />
        <span>Đặt bàn thành công</span>
      </div>
      <div className="ml-7 text-sm flex flex-col gap-1">
        <div>Bàn <span className="font-semibold">{tableNo}</span> cho <span className="font-semibold">{people} người</span></div>
        <div>Thời gian: <span className="font-semibold">{time}</span> ngày <span className="font-semibold">{date}</span></div>
      </div>
    </div>
  );
};

// Component tùy chỉnh cho Toast thông tin
const InfoToast = ({ name, table, people, time, note }: { name: string, table: string, people: number, time: string, note?: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 font-medium">
        <Info className="h-5 w-5 text-blue-500" />
        <span>Thông tin đặt bàn: {name}</span>
      </div>
      <div className="ml-7 text-sm flex flex-col gap-1">
        <div>Bàn <span className="font-semibold">{table}</span> cho <span className="font-semibold">{people} người</span></div>
        <div>Thời gian: <span className="font-semibold">{time}</span></div>
        {note && <div>Ghi chú: <span className="italic">{note}</span></div>}
      </div>
    </div>
  );
};

// Component chính cho Dashboard
function DashboardContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState(mockReservations);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lấy ngày đầu tuần (Thứ Hai)
  const startOfCurrentWeek = useMemo(() => 
    startOfWeek(currentDate, { weekStartsOn: 1 }), 
    [currentDate]
  );
  
  // Tạo mảng 7 ngày từ ngày đầu tuần
  const weekDays = useMemo(() => 
    Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(startOfCurrentWeek, index);
      const dayName = format(date, "EEEE", { locale: vi });
      const dayShort = format(date, "dd/MM");
      return { date, dayName, dayShort };
    }), 
    [startOfCurrentWeek]
  );

  // Helper để lấy đặt bàn theo ngày
  const getReservationsForDate = useCallback((date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    return reservations.filter(reservation => 
      reservation.date === formattedDate
    );
  }, [reservations]);

  // Helper để lấy lớp CSS cho ô đặt bàn
  const getReservationClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700";
      case "pending":
        return "bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700";
      case "cancelled":
        return "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700";
      default:
        return "";
    }
  };

  // Xử lý tuần trước
  const handlePrevWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
    toast.info("Đã chuyển đến tuần trước", {
      position: "bottom-right",
      duration: 2000,
    });
  };

  // Xử lý tuần kế tiếp
  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
    toast.info("Đã chuyển đến tuần sau", {
      position: "bottom-right",
      duration: 2000,
    });
  };

  // Xử lý chọn ngày
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    
    const formattedDate = format(date, "dd/MM/yyyy");
    // Hiển thị toast khi chọn ngày
    toast.info(`Đã chọn ngày ${formattedDate}`, {
      position: "bottom-right",
      duration: 2000,
    });
  };

  // NOTE: Khi tích hợp với Supabase, hàm này sẽ gọi API để thêm đặt bàn mới
  const handleAddReservation = (data: ReservationData) => {
    // Bắt đầu loading
    setLoading(true);
    
    // Giả lập việc gọi API
    setTimeout(() => {
      // Chuẩn bị dữ liệu đặt bàn mới
      const tableNo = data.tableNo || `T${Math.floor(Math.random() * 20) + 1}`.padStart(3, '0');
      const newReservation = {
        id: `${reservations.length + 1}`,
        name: data.name,
        phone: data.phone,
        email: data.email || "",
        time: data.time,
        date: format(data.date as Date, "yyyy-MM-dd"),
        people: parseInt(data.people, 10),
        table: tableNo,
        note: data.notes || "",
        status: "confirmed",
        created_at: new Date().toISOString()
      };

      // Thêm đặt bàn mới vào danh sách
      setReservations([...reservations, newReservation]);
      
      // Kết thúc loading
      setLoading(false);
      
      // Đóng form
      setOpen(false);
      
      // Hiển thị thông báo thành công bằng sonner toast với component tùy chỉnh
      toast.custom(() => (
        <SuccessToast 
          tableNo={tableNo}
          people={newReservation.people}
          time={newReservation.time}
          date={format(parseISO(newReservation.date), "dd/MM/yyyy")}
        />
      ), {
        duration: 5000,
      });
    }, 1500); // Giả lập độ trễ mạng
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lịch đặt bàn</h1>
          <p className="text-muted-foreground">
            Quản lý lịch đặt bàn và đặt bàn mới
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevWeek}
              className="hover:bg-primary/10 transition-colors"
              aria-label="Tuần trước"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[150px] hover:bg-primary/10 transition-colors"
                >
                  <Calendar className="mr-2 h-4 w-4 text-primary" />
                  <span>{format(startOfCurrentWeek, "dd/MM")} - {format(addDays(startOfCurrentWeek, 6), "dd/MM")}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => {
                    if (date) {
                      setCurrentDate(date);
                      setCalendarOpen(false);
                      toast.info(`Đã chọn tuần của ngày ${format(date, "dd/MM/yyyy")}`, {
                        position: "bottom-right",
                        duration: 2000,
                      });
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextWeek}
              className="hover:bg-primary/10 transition-colors"
              aria-label="Tuần sau"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                onClick={() => {
                  // Thông báo khi nhấn nút đặt bàn mới
                  toast.info("Đang mở form đặt bàn", {
                    position: "bottom-right",
                    duration: 2000,
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Đặt bàn mới
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Đặt bàn mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin để đặt bàn cho khách hàng.
                </DialogDescription>
              </DialogHeader>
              {loading ? (
                <div className="space-y-4 py-4">
                  <Skeleton className="h-10 w-full mb-4" />
                  <Skeleton className="h-10 w-full mb-4" />
                  <Skeleton className="h-10 w-full mb-4" />
                  <Skeleton className="h-10 w-full mb-4" />
                  <Skeleton className="h-10 w-full mb-4" />
                  <div className="flex justify-end gap-2 mt-6">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              ) : (
                <ReservationForm onCancel={() => setOpen(false)} onSubmit={handleAddReservation} />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="px-6 py-4 bg-primary/5">
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-primary" />
            Lịch đặt bàn tuần này
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 bg-muted/50">
            {weekDays.map((day) => (
              <button
                key={day.dayShort}
                className={cn(
                  "flex flex-col items-center justify-center border-r border-b py-2 transition-colors",
                  isToday(day.date) && "bg-primary/10",
                  isSameDay(day.date, selectedDate) && "bg-primary/20"
                )}
                onClick={() => handleSelectDate(day.date)}
              >
                <span className="text-xs capitalize">{day.dayName}</span>
                <span className={cn(
                  "text-sm font-medium",
                  isToday(day.date) && "text-primary"
                )}>{day.dayShort}</span>
              </button>
            ))}
          </div>
          
          <div className="relative min-h-[500px]">
            {/* Thời gian */}
            <div className="absolute left-0 top-0 w-16 bg-muted/30 border-r h-full">
              {timeSlots.map((time, index) => (
                <div
                  key={time}
                  className="h-12 border-b flex items-center justify-center"
                >
                  <span className="text-xs font-medium">{time}</span>
                </div>
              ))}
            </div>
            
            {/* Vùng hiển thị sự kiện */}
            <div className="ml-16">
              {/* Grid các ngày trong tuần */}
              <div className="grid grid-cols-7 h-full">
                {weekDays.map((day, dayIndex) => (
                  <div 
                    key={day.dayShort}
                    className="relative border-r min-h-[500px]"
                  >
                    {/* Các dòng giờ ngang */}
                    {timeSlots.map((time, i) => (
                      <div
                        key={`${dayIndex}-${i}`}
                        className="absolute w-full border-b h-12"
                        style={{ top: `${i * 48}px` }}
                      />
                    ))}
                    
                    {/* Các đặt bàn trong ngày */}
                    {getReservationsForDate(day.date).map((reservation) => {
                      // Tính vị trí dựa trên giờ đặt bàn
                      const timeIndex = timeSlots.findIndex(t => t === reservation.time);
                      if (timeIndex === -1) return null;
                      
                      return (
                        <div
                          key={reservation.id}
                          className={cn(
                            "absolute rounded-md border p-2 w-[90%] shadow-sm cursor-pointer hover:opacity-90 transition-all hover:shadow-md",
                            getReservationClass(reservation.status)
                          )}
                          style={{
                            top: `${timeIndex * 48}px`,
                            left: `${dayIndex * 100 / 7}%`,
                            height: "48px", // 1 hour
                            transform: "translateX(-50%)",
                            width: "90%"
                          }}
                          onClick={() => {
                            // Hiển thị chi tiết đặt bàn bằng toast với component tùy chỉnh
                            toast.custom(() => (
                              <InfoToast 
                                name={reservation.name}
                                table={reservation.table}
                                people={reservation.people}
                                time={reservation.time}
                                note={reservation.note}
                              />
                            ), {
                              duration: 5000,
                            });
                          }}
                        >
                          <div className="text-xs font-medium truncate">
                            {reservation.name} - {reservation.table}
                          </div>
                          <div className="text-xs truncate">
                            {reservation.people} người - {reservation.time}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Trang Dashboard chính với Suspense
export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
} 