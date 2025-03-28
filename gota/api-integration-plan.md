# Kế hoạch tích hợp API giữa Web Admin Dashboard và App Android Gota

## 1. Phân tích vấn đề hiện tại

Dựa trên kiểm tra code hiện tại, tôi phát hiện những vấn đề sau:

1. **Không có API endpoint riêng biệt**: Web Admin Dashboard hiện tại đang gọi trực tiếp đến Supabase, không có layer API trung gian
2. **Thiếu phân quyền theo vai trò**: Cần phân biệt rõ quyền của admin (web) và người dùng thông thường (app)
3. **Không có documentation về API**: Thiếu tài liệu hướng dẫn tích hợp cho app mobile
4. **Truy vấn dữ liệu không hiệu quả**: Nhiều truy vấn lồng nhau không cần thiết
5. **Xung đột giữa Web Admin và App Android**: Cấu trúc database chưa hoàn toàn đáp ứng được nhu cầu của cả hai nền tảng

## 2. Giải pháp tích hợp

### 2.1. Tạo API Layer chung

Tạo một API layer chung để cả Web Admin và App Android có thể sử dụng:

```
/api/
  /auth/          # API xác thực (đăng nhập, đăng ký, refresh token)
  /restaurants/   # API quản lý nhà hàng 
  /reservations/  # API quản lý đặt bàn
  /users/         # API quản lý người dùng
  /reviews/       # API quản lý đánh giá
  /statistics/    # API thống kê (chỉ cho admin)
  /mobile/        # API riêng cho ứng dụng di động (offline sync, push notifications)
```

### 2.2. Chuẩn hóa Response Format

Định dạng response chuẩn cho tất cả API:

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

### 2.3. Thiết kế Authentication Flow

1. **Web Admin**:
   - Đăng nhập bằng email/password
   - Nhận JWT token từ Supabase
   - Lưu token trong localStorage/cookie
   - Refresh token khi hết hạn

2. **App Android**:
   - Đăng nhập bằng email/password hoặc Google/Facebook
   - Nhận JWT token từ Supabase
   - Lưu token trong SharedPreferences
   - Refresh token khi hết hạn
   - Đăng ký device token cho push notifications

### 2.4. Đánh giá xung đột giữa Web Admin và App Android

Sau khi phân tích cấu trúc dự án Android và Web Admin, chúng tôi xác định các điểm xung đột tiềm ẩn:

1. **Khác biệt về phân quyền**: Web Admin cần quyền truy cập toàn bộ dữ liệu, trong khi App Android chỉ cần truy cập dữ liệu của người dùng
2. **Thiếu bảng quản lý thiết bị**: Cần bổ sung bảng quản lý thông tin thiết bị cho việc gửi thông báo đẩy
3. **Thiếu cơ chế đồng bộ hóa offline**: App Android cần hỗ trợ làm việc offline, cần có cơ chế đồng bộ
4. **Thiếu các function tối ưu cho mobile**: Cần bổ sung các stored functions đặc thù cho ứng dụng di động

## 3. Kế hoạch triển khai

### Tuần 1: Tạo API Endpoints cơ bản

1. **Tạo router cho API trong Next.js**:
   ```
   /app/api/[...segments]/route.ts  # Tạo API router
   ```

2. **Tạo các controller cho từng endpoint**:
   ```
   /app/api/auth/route.ts
   /app/api/restaurants/route.ts
   /app/api/reservations/route.ts
   /app/api/mobile/sync/route.ts    # Endpoint đồng bộ hóa
   ```

3. **Triển khai middleware xác thực**:
   ```typescript
   // Middleware cho API
   export async function middleware(request: NextRequest) {
     // Kiểm tra token và quyền
   }
   ```

4. **Thiết lập database theo cấu trúc mới**:
   - Áp dụng `setup_1.sql` - Thiết lập admin management
   - Áp dụng `setup_2.sql` - Thiết lập tables management
   - Áp dụng `setup_3.sql` - Thiết lập settings, notifications, logs & functions
   - Áp dụng `setup_mobile.sql` - Bổ sung cấu trúc cho ứng dụng mobile

### Tuần 2: Implement API Authentication và Documentation

1. **Triển khai API Authentication**:
   - Login/Signup endpoints
   - Token refresh
   - Logout
   - Đăng ký thiết bị (device registration)

2. **Tạo tài liệu API với Swagger/OpenAPI**:
   - Mô tả chi tiết các endpoints
   - Cấu trúc request/response
   - Các mã lỗi

3. **Áp dụng middleware phân quyền**:
   - Admin Role (Web)
   - User Role (App)
   - Restaurant Owner Role (cả hai)

### Tuần 3: Implement API cho App Android

1. **API Danh sách nhà hàng và tìm kiếm**:
   - GET /api/restaurants
   - GET /api/restaurants/:id
   - GET /api/restaurants/search?query=...
   - GET /api/restaurants/nearby?lat=...&lng=...&radius=...

2. **API Đặt bàn**:
   - POST /api/reservations
   - GET /api/reservations/user/:userId
   - PUT /api/reservations/:id
   - DELETE /api/reservations/:id

3. **API Đánh giá**:
   - POST /api/reviews
   - GET /api/reviews/restaurant/:restaurantId

4. **API Đồng bộ hóa offline**:
   - GET /api/mobile/sync?last_sync=...
   - POST /api/mobile/sync (upload local changes)

### Tuần 4: Tối ưu hóa và Testing

1. **Tối ưu hóa hiệu suất API**:
   - Thêm caching
   - Giảm số lượng truy vấn database
   - Batch requests cho mobile

2. **Viết tests cho API**:
   - Unit tests cho controllers
   - Integration tests cho API endpoints

3. **Triển khai rate limiting và security**:
   - Giới hạn số lượng request
   - Bảo vệ API khỏi tấn công

4. **Implement Push Notifications**:
   - Tích hợp với Firebase Cloud Messaging
   - API đăng ký/hủy đăng ký thiết bị

### Tuần 5: Tích hợp với App Android

1. **Xây dựng SDK/Client cho Android**:
   - Tạo Retrofit interfaces
   - Implement authentication
   - Xử lý refresh token
   - Local caching với Room

2. **Viết documentation cho Mobile Developers**:
   - Hướng dẫn sử dụng API
   - Mẫu code tích hợp

3. **Viết automation tests cho Android Client**:
   - Unit tests
   - Integration tests

4. **Implement Offline Mode**:
   - Lưu trữ dữ liệu local với Room
   - Đồng bộ hóa khi có kết nối
   - Conflict resolution

## 4. Mẫu API Endpoints

### 4.1. Authentication API

```
POST /api/auth/signup
Request: { email, password, name, phone }
Response: { user, token }

POST /api/auth/login
Request: { email, password }
Response: { user, token }

POST /api/auth/refresh
Request: { refreshToken }
Response: { token, refreshToken }

POST /api/auth/logout
Request: { token }
Response: { success }

POST /api/auth/register-device
Request: { device_token, device_type }
Response: { success }
```

### 4.2. Restaurants API

```
GET /api/restaurants?page=1&limit=10
Response: { restaurants[], pagination }

GET /api/restaurants/:id
Response: { restaurant }

GET /api/restaurants/search?query=...&cuisine=...
Response: { restaurants[], pagination }

GET /api/restaurants/nearby?lat=...&lng=...&radius=...
Response: { restaurants[], pagination }
```

### 4.3. Reservations API

```
POST /api/reservations
Request: { restaurant_id, date, time, guests, notes }
Response: { reservation }

GET /api/reservations/user/:userId
Response: { reservations[], pagination }

PUT /api/reservations/:id
Request: { status, date, time, guests, notes }
Response: { reservation }

DELETE /api/reservations/:id
Response: { success }
```

### 4.4. Mobile Sync API

```
GET /api/mobile/sync?last_sync=2023-05-01T12:00:00Z
Response: { 
  changes: {
    restaurants: [...],
    reservations: [...],
    reviews: [...]
  },
  sync_token: "2023-05-01T13:00:00Z"
}

POST /api/mobile/sync
Request: { 
  changes: {
    reservations: [...],
    reviews: [...]
  },
  last_sync: "2023-05-01T12:00:00Z"
}
Response: { 
  success: true,
  conflicts: [...],
  sync_token: "2023-05-01T13:00:00Z"
}
```

## 5. Kế hoạch tích hợp Database

1. **Cấu trúc database mới**:
   - **setup_1.sql**: Admin management (admin_roles, admin_users) và phân quyền
   - **setup_2.sql**: Table management (tables, reservation_tables, opening_hours, special_dates)
   - **setup_3.sql**: Settings, Notifications, Logs & Functions (triggers, statistics)
   - **setup_mobile.sql**: Bổ sung cấu trúc hỗ trợ mobile (device tokens, sync logs)

2. **Sử dụng RLS (Row Level Security) của Supabase**:
   - Tạo policies phân quyền dựa trên vai trò
   - Admin có quyền đọc/ghi toàn bộ dữ liệu
   - User chỉ có quyền đọc/ghi dữ liệu của mình
   - Thêm policies mới cho người dùng mobile:
     ```sql
     CREATE POLICY "Users can view public restaurants" ON restaurants
       FOR SELECT USING (is_public = true OR auth.uid() IN (
         SELECT user_id FROM restaurant_favorites WHERE restaurant_id = restaurants.id
       ));
     ```

3. **Tạo Functions cho Mobile App**:
   - Tạo stored functions trong Supabase cho các hoạt động phức tạp
   - Giảm số lượng API calls từ mobile
   - Thêm các functions đặc thù cho mobile:
     ```sql
     CREATE FUNCTION get_nearby_restaurants(lat float, lng float, radius float)
     RETURNS SETOF restaurants AS $$
       -- Tính toán khoảng cách và trả về nhà hàng gần đó
     $$ LANGUAGE plpgsql;
     ```

4. **Thêm Foreign Keys và Constraints**:
   - Đảm bảo tính toàn vẹn dữ liệu giữa các bảng
   - Dễ dàng truy xuất dữ liệu liên quan

5. **Bổ sung cấu trúc cho Mobile**:
   - Thêm bảng quản lý thiết bị:
     ```sql
     CREATE TABLE IF NOT EXISTS user_devices (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
       device_token TEXT NOT NULL,
       device_type TEXT NOT NULL,
       last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
     );
     ```
   - Thêm bảng nhật ký đồng bộ:
     ```sql
     CREATE TABLE IF NOT EXISTS sync_logs (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       table_name TEXT NOT NULL,
       record_id UUID NOT NULL,
       operation TEXT NOT NULL,
       timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
     );
     ```
   - Thêm bảng yêu thích của người dùng:
     ```sql
     CREATE TABLE IF NOT EXISTS restaurant_favorites (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
       restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
       UNIQUE(user_id, restaurant_id)
     );
     ```

## 6. Hỗ trợ Offline và Push Notifications

### 6.1. Chiến lược đồng bộ hóa offline

1. **Lưu trữ local với Room Database**:
   - App lưu trữ dữ liệu cần thiết trong cơ sở dữ liệu local
   - Thêm trường sync_status để theo dõi trạng thái đồng bộ (synced, modified, to_delete)

2. **Đồng bộ hóa theo timestamp**:
   - App lưu trữ timestamp của lần đồng bộ cuối
   - Khi có kết nối, app yêu cầu tất cả thay đổi sau timestamp đó

3. **Giải quyết xung đột**:
   - Nếu có xung đột (cùng một bản ghi được thay đổi trên server và client)
   - Server sẽ trả về thông tin xung đột
   - Client có thể chọn cách giải quyết (ưu tiên local, ưu tiên server, hoặc hỏi người dùng)

### 6.2. Push Notifications

1. **Đăng ký thiết bị**:
   - App đăng ký FCM token với server
   - Server lưu token và thông tin thiết bị vào bảng user_devices

2. **Gửi thông báo**:
   - Khi có sự kiện cần thông báo (đặt bàn mới, xác nhận đặt bàn, v.v.)
   - Server gửi thông báo qua FCM tới tất cả thiết bị của người dùng
   - Cập nhật trạng thái thông báo trong bảng notifications

3. **Tracking và Analytics**:
   - Theo dõi trạng thái thông báo (đã gửi, đã đọc)
   - Thống kê tỷ lệ mở thông báo và tương tác

4. **Triggers trong Database**:
   - Tạo triggers để tự động gửi thông báo khi có sự kiện
   - Ví dụ: Trigger khi status của reservation thay đổi thành confirmed 