import Link from "next/link";
import Image from "next/image";
import { CalendarClock, ChevronRight, Clock, Star, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Utensils className="h-5 w-5" />
            <span className="text-xl">GOTA</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Tính năng
            </Link>
            <Link href="/#about" className="text-muted-foreground hover:text-foreground transition-colors">
              Về chúng tôi
            </Link>
            <Link href="/#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Liên hệ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline">Đăng nhập</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Truy cập hệ thống</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-24 md:py-32 lg:py-40 border-b">
        <div className="container grid gap-6 md:grid-cols-2 md:gap-10 lg:grid-cols-[1fr_500px] lg:gap-16">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                Hệ thống đặt bàn tiện lợi cho nhà hàng
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Quản lý đặt bàn dễ dàng, tiện lợi và hiệu quả. Tối ưu hoá trải nghiệm khách hàng và nâng cao hiệu suất kinh doanh.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/dashboard">
                <Button size="lg" className="gap-1.5">
                  Bắt đầu ngay
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">
                  Tìm hiểu thêm
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarClock className="h-4 w-4" />
                <span>Dễ dàng quản lý</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Tiết kiệm thời gian</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>Tăng trải nghiệm</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted w-full">
        <Image
                src="/restaurant.jpg"
                alt="Restaurant interior"
                fill
                className="object-cover"
          priority
        />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-16 md:py-24 lg:py-32 border-b">
        <div className="container space-y-16">
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
              Tính năng
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
              Mọi thứ bạn cần để quản lý
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Hệ thống đặt bàn GOTA cung cấp đầy đủ các tính năng để quản lý nhà hàng hiệu quả.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <CalendarClock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Quản lý đặt bàn</h3>
              <p className="text-muted-foreground">
                Theo dõi và quản lý tất cả các đặt bàn trong một giao diện trực quan.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Quản lý khách hàng</h3>
              <p className="text-muted-foreground">
                Lưu trữ thông tin khách hàng và lịch sử đặt bàn để nâng cao trải nghiệm.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Báo cáo và thống kê</h3>
              <p className="text-muted-foreground">
                Theo dõi doanh thu, tỷ lệ lấp đầy và các số liệu quan trọng khác.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full py-16 md:py-24 lg:py-32">
        <div className="container grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
              Bắt đầu sử dụng GOTA ngay hôm nay
            </h2>
            <p className="text-muted-foreground md:text-xl">
              Hãy trải nghiệm hệ thống đặt bàn tiên tiến nhất hiện nay. Đăng ký miễn phí và khám phá các tính năng mạnh mẽ.
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/dashboard">
                <Button size="lg" className="gap-1.5">
                  Truy cập hệ thống
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#contact">
                <Button size="lg" variant="outline">
                  Liên hệ với chúng tôi
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted w-full">
            <Image
                src="/dashboard.jpg"
                alt="Dashboard preview"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t py-12 md:py-16">
        <div className="container flex flex-col gap-6 md:flex-row md:gap-8">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Utensils className="h-5 w-5" />
              <span className="text-xl">GOTA</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Hệ thống đặt bàn và quản lý nhà hàng hiệu quả
            </p>
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-medium">Liên kết</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">Trang chủ</Link>
              <Link href="/#features" className="hover:underline">Tính năng</Link>
              <Link href="/#about" className="hover:underline">Về chúng tôi</Link>
            </nav>
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-medium">Hỗ trợ</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="#" className="hover:underline">Trung tâm trợ giúp</Link>
              <Link href="#" className="hover:underline">Câu hỏi thường gặp</Link>
              <Link href="#" className="hover:underline">Liên hệ</Link>
            </nav>
          </div>
          <div className="flex-1 space-y-2" id="contact">
            <h3 className="font-medium">Liên hệ</h3>
            <p className="text-sm text-muted-foreground">
              Email: info@gota.vn<br />
              Điện thoại: 028 1234 5678<br />
              Địa chỉ: 123 Nguyễn Văn Linh, Quận 7, TP.HCM
            </p>
          </div>
        </div>
        <div className="container mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2023 GOTA. Bản quyền thuộc về GOTA</p>
        </div>
      </footer>
    </div>
  );
}
