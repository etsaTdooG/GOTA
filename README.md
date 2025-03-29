# GOTA - Good Taste Restaurant Reservation System

GOTA là hệ thống quản lý đặt bàn nhà hàng hiện đại, được xây dựng bằng Next.js và Supabase. Ứng dụng này cung cấp giải pháp toàn diện cho việc quản lý đặt bàn, quản lý nhà hàng và quản lý người dùng.

## Tính năng chính

- **Hệ thống đặt bàn**: Quản lý đặt bàn nhà hàng với các trạng thái khác nhau (Chờ xác nhận, Đã xác nhận, Đã hủy, Đã hoàn thành, Đã đến)
- **Quản lý nhà hàng**: Thêm, sửa, xóa thông tin nhà hàng
- **Quản lý bàn**: Quản lý thông tin bàn và sức chứa
- **Quản lý người dùng**: Phân quyền người dùng (khách hàng, quản trị viên, nhân viên)
- **Phân tích dữ liệu**: Thống kê và phân tích dữ liệu đặt bàn

## Công nghệ sử dụng

- **Frontend**: [Next.js 15](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **UI/UX**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
- **Backend/Database**: [Supabase](https://supabase.io/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel (đề xuất)

## Cấu trúc dữ liệu

Hệ thống sử dụng các bảng chính sau trong cơ sở dữ liệu:

- **Users**: Thông tin người dùng với các vai trò khác nhau (khách hàng, quản trị viên, nhân viên)
- **Restaurants**: Thông tin nhà hàng bao gồm tên, giờ mở cửa và đóng cửa
- **Tables**: Thông tin bàn trong nhà hàng, bao gồm số bàn và sức chứa
- **Reservations**: Thông tin đặt bàn, liên kết người dùng, nhà hàng và bàn

## Bắt đầu

### Yêu cầu hệ thống

- Node.js 20.x trở lên
- PNPM (khuyến nghị) hoặc NPM
- Tài khoản Supabase

### Cài đặt

1. Clone repository:

```bash
git clone https://github.com/your-username/gota.git
cd gota
```

2. Cài đặt dependencies:

```bash
pnpm install
```

3. Cấu hình biến môi trường:
   
Tạo file `.env.local` với nội dung:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Khởi tạo cơ sở dữ liệu:

```bash
pnpm seed
```

5. Chạy môi trường phát triển:

```bash
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

## Triển khai

Cách đơn giản nhất để triển khai ứng dụng Next.js là sử dụng [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) từ nhóm phát triển Next.js.

## Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng tạo issue hoặc pull request để đóng góp vào dự án.

## Giấy phép

[MIT](LICENSE)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
Thinking you're senior Developer UI for 30 years. The component is a complex calendar that displays events or reservations in different views (month, week, day). Here are some areas that I could improve:
Responsiveness issues:
The component has some mobile adjustments but could be improved
Some text might be too small on mobile devices
Layout structure could be better optimized for different screen sizes
UI consistency:
Some spacing and padding might be inconsistent
Typography hierarchy could be improved
Visual hierarchy and information density could be better balanced
Performance considerations:
The component is quite large and complex
Many state variables and calculations
Visual enhancements:
Could add better transitions and animations
Could improve color accessibility and contrast
Could improve the overall aesthetic feel
I'll focus on making targeted improvements to enhance the UI while keeping the core functionality intact. I'll make the component more responsive, visually appealing, and user-friendly.
@EventCalendar.tsx 