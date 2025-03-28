# Kế hoạch API cho Ứng dụng Di động (Flutter)

## 1. Tổng quan

API dành riêng cho ứng dụng di động Flutter sẽ được thiết kế với mục tiêu chính là trải nghiệm người dùng, hỗ trợ làm việc offline và tối ưu hóa hiệu suất trên thiết bị di động. API này sẽ được phân quyền dành cho người dùng thông thường.

## 2. Cấu trúc API

### 2.1. Cấu trúc thư mục API

```
/app/api/
├── /mobile/            # API dành riêng cho ứng dụng di động
│   ├── /auth/          # Xác thực người dùng
│   ├── /profile/       # Quản lý thông tin cá nhân
│   ├── /restaurants/   # Danh sách nhà hàng
│   ├── /reservations/  # Quản lý đặt bàn
│   ├── /reviews/       # Đánh giá và bình luận
│   ├── /favorites/     # Nhà hàng yêu thích
│   ├── /sync/          # Đồng bộ hóa offline
│   └── /notifications/ # Quản lý thông báo đẩy
└── /webhooks/          # Webhooks (Supabase, thanh toán, v.v.)
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
  sync_token?: string; // Token đồng bộ hóa
}
```

## 3. Danh sách Endpoints

### 3.1. Authentication API

```
POST /api/mobile/auth/signup
- Request: { email, password, name, phone }
- Response: { user, token, refreshToken }

POST /api/mobile/auth/login
- Request: { email, password }
- Response: { user, token, refreshToken }

POST /api/mobile/auth/social-login
- Request: { provider, token } // provider: google, facebook
- Response: { user, token, refreshToken }

POST /api/mobile/auth/refresh
- Request: { refreshToken }
- Response: { token, refreshToken }

POST /api/mobile/auth/logout
- Request: { deviceToken }
- Response: { success }

POST /api/mobile/auth/forgot-password
- Request: { email }
- Response: { success }

POST /api/mobile/auth/reset-password
- Request: { token, password }
- Response: { success }
```

### 3.2. Profile API

```
GET /api/mobile/profile
- Response: { user }

PUT /api/mobile/profile
- Request: { name, phone, avatar, preferences, ... }
- Response: { user }

POST /api/mobile/profile/change-password
- Request: { oldPassword, newPassword }
- Response: { success }

POST /api/mobile/profile/register-device
- Request: { deviceToken, deviceType, deviceName, appVersion }
- Response: { success }

DELETE /api/mobile/profile/unregister-device
- Request: { deviceToken }
- Response: { success }
```

### 3.3. Restaurants API

```
GET /api/mobile/restaurants
- Query: ?page=1&limit=10&search=...&cuisine=...&price=...
- Response: { restaurants[], pagination }

GET /api/mobile/restaurants/nearby
- Query: ?lat=...&lng=...&radius=5&page=1&limit=10
- Response: { restaurants[], pagination }

GET /api/mobile/restaurants/:id
- Response: { restaurant }

GET /api/mobile/restaurants/:id/tables
- Query: ?date=...&time=...&guests=...
- Response: { availableTables[] }

GET /api/mobile/restaurants/:id/reviews
- Query: ?page=1&limit=10
- Response: { reviews[], pagination }

GET /api/mobile/restaurants/recommended
- Query: ?limit=5
- Response: { restaurants[] }
```

### 3.4. Reservations API

```
GET /api/mobile/reservations
- Query: ?status=...&from=...&to=...
- Response: { reservations[], pagination }

GET /api/mobile/reservations/:id
- Response: { reservation }

POST /api/mobile/reservations
- Request: { restaurantId, date, time, guests, tables[], notes, ... }
- Response: { reservation }

PUT /api/mobile/reservations/:id
- Request: { status, date, time, guests, notes, ... }
- Response: { reservation }

DELETE /api/mobile/reservations/:id
- Response: { success }
```

### 3.5. Reviews API

```
POST /api/mobile/restaurants/:id/reviews
- Request: { rating, comment, photos[] }
- Response: { review }

PUT /api/mobile/reviews/:id
- Request: { rating, comment, photos[] }
- Response: { review }

DELETE /api/mobile/reviews/:id
- Response: { success }

GET /api/mobile/reviews/user
- Query: ?page=1&limit=10
- Response: { reviews[], pagination }
```

### 3.6. Favorites API

```
GET /api/mobile/favorites
- Query: ?page=1&limit=10
- Response: { restaurants[], pagination }

POST /api/mobile/favorites/:restaurantId
- Response: { success }

DELETE /api/mobile/favorites/:restaurantId
- Response: { success }
```

### 3.7. Sync API

```
GET /api/mobile/sync
- Query: ?lastSync=...
- Response: { 
    changes: {
      restaurants: [...],
      reservations: [...],
      reviews: [...],
      favorites: [...]
    },
    deletedRecords: {
      restaurants: [ids],
      reservations: [ids],
      reviews: [ids],
      favorites: [ids]
    },
    syncToken: "..." 
  }

POST /api/mobile/sync
- Request: { 
    changes: {
      reservations: [...],
      reviews: [...],
      favorites: [...]
    },
    lastSync: "..."
  }
- Response: { 
    success: true, 
    conflicts: [...], 
    syncToken: "..." 
  }
```

### 3.8. Notifications API

```
GET /api/mobile/notifications
- Query: ?page=1&limit=20&read=false
- Response: { notifications[], pagination }

PUT /api/mobile/notifications/:id/read
- Response: { success }

PUT /api/mobile/notifications/read-all
- Response: { success }

GET /api/mobile/notifications/settings
- Response: { settings }

PUT /api/mobile/notifications/settings
- Request: { reservationUpdates, promotions, ... }
- Response: { settings }
```

## 4. Middleware

### 4.1. Authentication Middleware

```typescript
// Ví dụ middleware xác thực người dùng
export async function mobileAuthMiddleware(request: NextRequest) {
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
    
    // Gắn thông tin user vào request
    request.headers.set('X-User-Id', user.id);
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Lỗi máy chủ' } },
      { status: 500 }
    );
  }
}
```

## 5. Các chiến lược cụ thể cho Mobile

### 5.1. Hỗ trợ làm việc Offline

```typescript
// Endpoint đồng bộ hóa
export async function GET(request: NextRequest) {
  // Middleware xác thực
  const middlewareResponse = await mobileAuthMiddleware(request);
  if (middlewareResponse instanceof NextResponse) {
    return middlewareResponse;
  }
  
  const userId = request.headers.get('X-User-Id');
  const { searchParams } = new URL(request.url);
  const lastSync = searchParams.get('lastSync') || new Date(0).toISOString();
  
  try {
    // Lấy thay đổi từ bảng sync_logs
    const { data: changes, error } = await supabase.rpc(
      'get_changes_since',
      { p_last_sync: lastSync, p_user_id: userId }
    );
    
    if (error) {
      throw error;
    }
    
    // Tổ chức dữ liệu thay đổi theo bảng
    const organizedChanges: Record<string, any[]> = {};
    const deletedRecords: Record<string, string[]> = {};
    
    changes.forEach((change: any) => {
      if (!organizedChanges[change.table_name]) {
        organizedChanges[change.table_name] = [];
      }
      
      if (!deletedRecords[change.table_name]) {
        deletedRecords[change.table_name] = [];
      }
      
      if (change.operation === 'DELETE') {
        deletedRecords[change.table_name].push(change.record_id);
      } else {
        organizedChanges[change.table_name].push(change.data);
      }
    });
    
    // Tạo sync token mới (timestamp hiện tại)
    const syncToken = new Date().toISOString();
    
    return NextResponse.json({
      success: true,
      data: {
        changes: organizedChanges,
        deletedRecords: deletedRecords,
        syncToken: syncToken
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'sync_error', message: error.message } },
      { status: 500 }
    );
  }
}
```

### 5.2. Push Notifications

```typescript
// Function gửi thông báo
export async function sendPushNotification(userId: string, title: string, body: string, data: any = {}) {
  try {
    // Lấy danh sách thiết bị của người dùng
    const { data: devices, error } = await supabase
      .from('user_devices')
      .select('device_token, device_type')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error || !devices.length) {
      return;
    }
    
    // Chuẩn bị payload thông báo
    const notification = {
      title,
      body,
      data
    };
    
    // Gửi thông báo đến từng thiết bị
    for (const device of devices) {
      if (device.device_type === 'android') {
        // Gửi qua FCM cho Android
        await sendFCMNotification(device.device_token, notification);
      } else if (device.device_type === 'ios') {
        // Gửi qua APNS cho iOS
        await sendAPNSNotification(device.device_token, notification);
      }
    }
    
    // Lưu thông báo vào database
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      body,
      data,
      is_read: false
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
```

### 5.3. Tối ưu hóa Dữ liệu

1. **Giảm lượng dữ liệu truyền tải**:
   - Chỉ trả về các trường cần thiết
   - Sử dụng phân trang với limit hợp lý
   - Nén dữ liệu JSON khi cần

2. **Caching trên ứng dụng**:
   - Sử dụng Room Database để lưu trữ
   - Cache hình ảnh và dữ liệu tĩnh
   - TTL (Time-to-live) cho dữ liệu cache

3. **Batching requests**:
   - Gom nhóm các thay đổi để đồng bộ một lần
   - Giảm số lượng API calls

## 6. Đảm bảo không xung đột với Web Admin API

Để tránh xung đột với Web Admin API, Mobile API sẽ:

1. **Sử dụng namespaces riêng biệt**: Tất cả API mobile sẽ nằm trong namespace `/api/mobile/`
2. **Áp dụng middleware xác thực người dùng**: Đảm bảo chỉ người dùng đã đăng nhập mới có quyền truy cập
3. **Tối ưu hóa truy vấn dữ liệu**: Sử dụng stored functions của Supabase để giảm số lượng API calls
4. **Tuân thủ các RLS policies của Supabase**: Đảm bảo không ghi đè hoặc xung đột với các policies dành cho web admin

## 7. Lộ trình triển khai

1. **Tuần 1**: Setup cơ sở hạ tầng API và middleware xác thực
2. **Tuần 2**: Triển khai các endpoints cơ bản (auth, profile, restaurants)
3. **Tuần 3**: Triển khai đặt bàn, đánh giá và yêu thích
4. **Tuần 4**: Triển khai cơ chế đồng bộ offline và push notifications
5. **Tuần 5**: Testing, optimization và documentation

## 8. Tích hợp Flutter Client

### 8.1. Cấu trúc Client

```
lib/
├── api/                   # API Client
│   ├── api_client.dart    # Client cơ bản với interceptors
│   ├── auth_api.dart      # API xác thực
│   ├── restaurant_api.dart # API nhà hàng
│   └── ...
├── models/                # Data models
├── repositories/          # Repositories
├── local/                 # Local database
├── blocs/                 # Business Logic
├── ui/                    # UI Widgets
└── utils/                 # Utilities
```

### 8.2. API Client

```dart
// api_client.dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  final Dio _dio = Dio();
  final FlutterSecureStorage _storage = FlutterSecureStorage();
  
  ApiClient() {
    _dio.options.baseUrl = 'https://your-api-domain.com/api/mobile';
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);
    
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Thêm token vào header
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioError error, handler) async {
        // Xử lý refresh token nếu 401
        if (error.response?.statusCode == 401) {
          if (await _refreshToken()) {
            // Thử lại request sau khi refresh token
            return handler.resolve(await _retry(error.requestOptions));
          }
        }
        return handler.next(error);
      },
    ));
  }
  
  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return false;
      
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      
      if (response.statusCode == 200) {
        await _storage.write(key: 'auth_token', value: response.data['token']);
        await _storage.write(key: 'refresh_token', value: response.data['refreshToken']);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  
  Future<Response<dynamic>> _retry(RequestOptions requestOptions) async {
    final options = Options(
      method: requestOptions.method,
      headers: requestOptions.headers,
    );
    
    return _dio.request<dynamic>(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }
  
  // API methods
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }
  
  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }
  
  Future<Response> put(String path, {dynamic data}) {
    return _dio.put(path, data: data);
  }
  
  Future<Response> delete(String path) {
    return _dio.delete(path);
  }
}
```

### 8.3. Offline Support

```dart
// sync_repository.dart
import 'package:sqflite/sqflite.dart';
import '../api/api_client.dart';
import '../local/database_helper.dart';

class SyncRepository {
  final ApiClient _apiClient;
  final DatabaseHelper _dbHelper;
  
  SyncRepository(this._apiClient, this._dbHelper);
  
  Future<bool> syncData() async {
    try {
      final lastSync = await _dbHelper.getLastSyncTime();
      
      // Lấy thay đổi từ server
      final response = await _apiClient.get('/sync', queryParameters: {
        'lastSync': lastSync,
      });
      
      if (response.statusCode == 200 && response.data['success']) {
        final data = response.data['data'];
        
        // Xử lý thay đổi từ server
        await _processServerChanges(data['changes'], data['deletedRecords']);
        
        // Đồng bộ thay đổi local lên server
        await _syncLocalChanges();
        
        // Cập nhật sync token
        await _dbHelper.updateLastSyncTime(data['syncToken']);
        
        return true;
      }
      
      return false;
    } catch (e) {
      print('Sync error: $e');
      return false;
    }
  }
  
  Future<void> _processServerChanges(
    Map<String, List<dynamic>> changes, 
    Map<String, List<String>> deletedRecords
  ) async {
    final db = await _dbHelper.database;
    
    await db.transaction((txn) async {
      // Xử lý các bản ghi bị xóa
      for (final entry in deletedRecords.entries) {
        final tableName = entry.key;
        final ids = entry.value;
        
        if (ids.isNotEmpty) {
          final idList = ids.map((id) => "'$id'").join(',');
          await txn.rawDelete('DELETE FROM $tableName WHERE id IN ($idList)');
        }
      }
      
      // Xử lý các bản ghi thay đổi
      for (final entry in changes.entries) {
        final tableName = entry.key;
        final records = entry.value;
        
        for (final record in records) {
          // Kiểm tra xem bản ghi đã tồn tại chưa
          final exists = await txn.query(
            tableName,
            where: 'id = ?',
            whereArgs: [record['id']],
            limit: 1,
          );
          
          if (exists.isNotEmpty) {
            // Cập nhật bản ghi hiện có
            await txn.update(
              tableName,
              record,
              where: 'id = ?',
              whereArgs: [record['id']],
            );
          } else {
            // Thêm bản ghi mới
            await txn.insert(tableName, record);
          }
        }
      }
    });
  }
  
  Future<void> _syncLocalChanges() async {
    final db = await _dbHelper.database;
    
    // Lấy các thay đổi cần đồng bộ
    final reservations = await db.query(
      'reservations',
      where: 'sync_status != ?',
      whereArgs: ['synced'],
    );
    
    final reviews = await db.query(
      'reviews',
      where: 'sync_status != ?',
      whereArgs: ['synced'],
    );
    
    final favorites = await db.query(
      'restaurant_favorites',
      where: 'sync_status != ?',
      whereArgs: ['synced'],
    );
    
    if (reservations.isEmpty && reviews.isEmpty && favorites.isEmpty) {
      return;
    }
    
    // Gửi thay đổi lên server
    final lastSync = await _dbHelper.getLastSyncTime();
    final response = await _apiClient.post('/sync', data: {
      'changes': {
        'reservations': reservations,
        'reviews': reviews,
        'favorites': favorites,
      },
      'lastSync': lastSync,
    });
    
    if (response.statusCode == 200 && response.data['success']) {
      // Cập nhật trạng thái đồng bộ
      await db.transaction((txn) async {
        await txn.rawUpdate(
          "UPDATE reservations SET sync_status = 'synced' WHERE sync_status != 'synced'"
        );
        await txn.rawUpdate(
          "UPDATE reviews SET sync_status = 'synced' WHERE sync_status != 'synced'"
        );
        await txn.rawUpdate(
          "UPDATE restaurant_favorites SET sync_status = 'synced' WHERE sync_status != 'synced'"
        );
      });
      
      // Xử lý xung đột nếu có
      _handleConflicts(response.data['conflicts']);
    }
  }
  
  void _handleConflicts(List<dynamic> conflicts) {
    // Xử lý xung đột dữ liệu
    // Có thể hiển thị thông báo cho người dùng hoặc tự động giải quyết
  }
}
``` 