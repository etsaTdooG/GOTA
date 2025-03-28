# Kế hoạch API cho Web Admin Dashboard (NextJS)

## 1. Tổng quan

API dành riêng cho Web Admin Dashboard (NextJS) sẽ được thiết kế với mục tiêu chính là quản lý hệ thống nhà hàng, đặt bàn và báo cáo thống kê. API này sẽ được phân quyền chặt chẽ chỉ dành cho admin.

## 2. Cấu trúc API

### 2.1. Cấu trúc thư mục API

```
/app/api/
├── /admin/              # API chỉ dành cho admin
│   ├── /auth/           # Xác thực admin
│   ├── /restaurants/    # Quản lý nhà hàng
│   ├── /tables/         # Quản lý bàn
│   ├── /reservations/   # Quản lý đặt bàn
│   ├── /users/          # Quản lý người dùng
│   ├── /statistics/     # Báo cáo thống kê
│   └── /settings/       # Cài đặt hệ thống
└── /webhooks/           # Webhooks (Supabase, thanh toán, v.v.)
```

### 2.2. Chuẩn hóa Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## 3. Danh sách Endpoints

### 3.1. Authentication API

```
POST /api/admin/auth/login
- Request: { email, password }
- Response: { user, token }

POST /api/admin/auth/refresh
- Request: { refreshToken }
- Response: { token, refreshToken }

POST /api/admin/auth/logout
- Request: { token }
- Response: { success }
```

### 3.2. Restaurants API

```
GET /api/admin/restaurants
- Query: ?page=1&limit=10&search=...
- Response: { restaurants[], pagination }

GET /api/admin/restaurants/:id
- Response: { restaurant }

POST /api/admin/restaurants
- Request: { name, description, address, ... }
- Response: { restaurant }

PUT /api/admin/restaurants/:id
- Request: { name, description, address, ... }
- Response: { restaurant }

DELETE /api/admin/restaurants/:id
- Response: { success }

GET /api/admin/restaurants/:id/statistics
- Query: ?period=week&start=...&end=...
- Response: { statistics }
```

### 3.3. Tables API

```
GET /api/admin/restaurants/:restaurantId/tables
- Query: ?page=1&limit=10
- Response: { tables[], pagination }

GET /api/admin/tables/:id
- Response: { table }

POST /api/admin/restaurants/:restaurantId/tables
- Request: { number, capacity, location, ... }
- Response: { table }

PUT /api/admin/tables/:id
- Request: { number, capacity, location, ... }
- Response: { table }

DELETE /api/admin/tables/:id
- Response: { success }
```

### 3.4. Reservations API

```
GET /api/admin/reservations
- Query: ?page=1&limit=10&restaurant=...&status=...&date=...
- Response: { reservations[], pagination }

GET /api/admin/reservations/:id
- Response: { reservation }

POST /api/admin/reservations
- Request: { restaurant_id, user_id, date, time, guests, notes, ... }
- Response: { reservation }

PUT /api/admin/reservations/:id
- Request: { status, date, time, guests, notes, ... }
- Response: { reservation }

DELETE /api/admin/reservations/:id
- Response: { success }
```

### 3.5. Users API

```
GET /api/admin/users
- Query: ?page=1&limit=10&search=...
- Response: { users[], pagination }

GET /api/admin/users/:id
- Response: { user }

POST /api/admin/users
- Request: { email, password, name, phone, ... }
- Response: { user }

PUT /api/admin/users/:id
- Request: { name, phone, is_active, ... }
- Response: { user }

DELETE /api/admin/users/:id
- Response: { success }

GET /api/admin/users/:id/reservations
- Query: ?page=1&limit=10
- Response: { reservations[], pagination }
```

### 3.6. Statistics API

```
GET /api/admin/statistics/overview
- Query: ?period=week&start=...&end=...
- Response: { totalReservations, totalUsers, occupancyRate, ... }

GET /api/admin/statistics/reservations
- Query: ?period=week&start=...&end=...&restaurant=...
- Response: { data[] } // Dữ liệu theo ngày/tuần/tháng

GET /api/admin/statistics/users
- Query: ?period=week&start=...&end=...
- Response: { registrations[], active[] }

GET /api/admin/statistics/restaurants
- Query: ?period=week&start=...&end=...
- Response: { topRestaurants[], averageRatings[], ... }
```

### 3.7. Settings API

```
GET /api/admin/settings
- Response: { settings }

PUT /api/admin/settings
- Request: { site_name, contact_email, ... }
- Response: { settings }

GET /api/admin/settings/email-templates
- Response: { templates[] }

PUT /api/admin/settings/email-templates/:id
- Request: { subject, body, ... }
- Response: { template }
```

## 4. Middleware

### 4.1. Authentication Middleware

```typescript
// Ví dụ middleware xác thực admin
export async function adminAuthMiddleware(request: NextRequest) {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'unauthorized', message: 'Bạn chưa đăng nhập' } },
      { status: 401 }
    );
  }
  
  try {
    // Xác thực token với Supabase
    const { data: user, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Token không hợp lệ' } },
        { status: 401 }
      );
    }
    
    // Kiểm tra user có phải admin không
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single();
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: { code: 'forbidden', message: 'Bạn không có quyền truy cập' } },
        { status: 403 }
      );
    }
    
    // Gắn thông tin admin vào request
    request.headers.set('X-Admin-Id', adminUser.id);
    request.headers.set('X-Admin-Role', adminUser.role);
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Lỗi máy chủ' } },
      { status: 500 }
    );
  }
}
```

## 5. Cách triển khai

### 5.1. Tương tác với Supabase

Web Admin sẽ tương tác với Supabase thông qua API middleware riêng, thay vì gọi trực tiếp:

```typescript
// api/admin/restaurants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/middlewares';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // Áp dụng middleware xác thực admin
  const middlewareResponse = await adminAuthMiddleware(request);
  if (middlewareResponse instanceof NextResponse) {
    return middlewareResponse;
  }
  
  // Xử lý query params
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  
  // Tính offset
  const offset = (page - 1) * limit;
  
  try {
    // Query dữ liệu từ Supabase với các ràng buộc liên quan đến admin
    let query = supabase
      .from('restaurants')
      .select('*, reviews(*)', { count: 'exact' });
    
    // Thêm điều kiện tìm kiếm nếu có
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    // Thêm phân trang
    const { data: restaurants, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    // Tính tổng số trang
    const totalPages = Math.ceil((count || 0) / limit);
    
    // Trả về response
    return NextResponse.json({
      success: true,
      data: restaurants,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'query_error', message: error.message } },
      { status: 500 }
    );
  }
}
```

### 5.2. Phân quyền

Web Admin Dashboard sẽ sử dụng hệ thống phân quyền dựa trên vai trò (role-based access control):

```typescript
// Ví dụ middleware phân quyền theo vai trò
export async function adminRoleMiddleware(request: NextRequest, requiredRoles: string[]) {
  const adminRole = request.headers.get('X-Admin-Role');
  
  if (!adminRole || !requiredRoles.includes(adminRole)) {
    return NextResponse.json(
      { success: false, error: { code: 'forbidden', message: 'Bạn không có quyền thực hiện hành động này' } },
      { status: 403 }
    );
  }
  
  return NextResponse.next();
}
```

## 6. Đảm bảo không xung đột với Mobile API

Để tránh xung đột với Mobile API, Web Admin API sẽ:

1. **Sử dụng namespaces riêng biệt**: Tất cả API admin sẽ nằm trong namespace `/api/admin/`
2. **Áp dụng middleware xác thực admin**: Đảm bảo chỉ admin mới có quyền truy cập
3. **Quản lý truy vấn dữ liệu**: Thực hiện các truy vấn phức tạp ở server-side, giảm tải cho client
4. **Tuân thủ các RLS policies của Supabase**: Đảm bảo không ghi đè hoặc xung đột với các policies dành cho mobile

## 7. Lộ trình triển khai

1. **Tuần 1**: Setup cơ sở hạ tầng API và middleware
2. **Tuần 2**: Triển khai các endpoints cơ bản (auth, restaurants, tables)
3. **Tuần 3**: Triển khai quản lý đặt bàn và người dùng
4. **Tuần 4**: Triển khai báo cáo thống kê và cài đặt
5. **Tuần 5**: Testing, optimization và documentation 