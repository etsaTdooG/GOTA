# Bài học kinh nghiệm khi làm việc với Next.js

## Lỗi: Thiếu chỉ thị "use client" khi sử dụng các hooks client-side

### Vấn đề gặp phải

Khi triển khai chức năng chuyển hướng sau khi đăng nhập, chúng ta đã gặp lỗi:

```
You're importing a component that needs `useRouter`. This React hook only works in a client component. To fix, mark the file (or its parent) with the `"use client"` directive.
```

### Nguyên nhân

Trong Next.js App Router, mặc định tất cả các component đều là Server Components. Tuy nhiên, một số hooks của React như `useState`, `useEffect`, `useRouter`, v.v. chỉ hoạt động ở phía client.

Khi chúng ta sử dụng `useRouter` từ `next/navigation` để thực hiện chuyển hướng, chúng ta cần đánh dấu component đó là một Client Component.

### Cách giải quyết

Thêm chỉ thị `"use client"` ở đầu file chứa component:

```tsx
"use client"

import { useRouter } from "next/navigation"
// phần còn lại của component
```

### Bài học rút ra

1. **Phân biệt Server Components và Client Components**:
   - Server Components: Render ở server, không thể sử dụng hooks của React, không có state
   - Client Components: Render ở client, có thể sử dụng toàn bộ tính năng của React

2. **Khi nào cần thêm `"use client"`**:
   - Khi sử dụng React hooks (`useState`, `useEffect`, `useContext`, v.v.)
   - Khi sử dụng các event handlers (`onClick`, `onChange`, v.v.)
   - Khi sử dụng browser APIs
   - Khi sử dụng các thư viện client-side

3. **Tối ưu hiệu suất**:
   - Chỉ sử dụng Client Components khi cần thiết
   - Đặt chỉ thị `"use client"` càng sâu càng tốt trong cây component

## Các vấn đề khác cần lưu ý khi sử dụng Next.js

1. **Định tuyến và chuyển hướng**:
   - Sử dụng `useRouter` từ `next/navigation` (không phải `next/router` như trong Pages Router)
   - Tránh sử dụng `window.location` cho chuyển hướng vì nó sẽ làm tải lại toàn bộ ứng dụng

2. **Form handling**:
   - Luôn sử dụng `e.preventDefault()` trong các hàm xử lý form để tránh tải lại trang
   - Xem xét sử dụng thư viện quản lý form như React Hook Form cho các form phức tạp

3. **Authentication**:
   - Xem xét sử dụng các giải pháp như NextAuth.js, Auth.js, Clerk cho việc xác thực
   - Lưu thông tin xác thực vào cookies hoặc localStorage để duy trì trạng thái đăng nhập 