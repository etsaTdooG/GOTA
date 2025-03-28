import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-8">GOTA - Ứng dụng đặt bàn nhà hàng</h1>
      
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild>
          <Link href="/dashboard">
            Vào trang quản lý
          </Link>
        </Button>
        
        <Button variant="outline" asChild>
          <Link href="https://github.com/your-username/gota" target="_blank" rel="noopener noreferrer">
            GitHub
          </Link>
        </Button>
      </div>
    </main>
  );
}
