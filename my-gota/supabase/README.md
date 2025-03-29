# Hướng dẫn Chuyển Dữ liệu JSON sang Supabase

Tài liệu này hướng dẫn các bước chuyển dữ liệu từ file JSON vào cơ sở dữ liệu Supabase.

## Các bước thực hiện

### 1. Chuẩn bị

- Đăng ký tài khoản tại [Supabase](https://supabase.com)
- Tạo một dự án mới trong Supabase
- Cài đặt công cụ CLI của Supabase (nếu bạn muốn sử dụng CLI)

### 2. Tạo cấu trúc bảng dữ liệu

Sử dụng script SQL trong file `setup.sql` để tạo các bảng và mối quan hệ cần thiết:

```bash
# Thực hiện qua giao diện Supabase SQL Editor
# Hoặc sử dụng CLI:
supabase db execute < ./supabase/setup.sql
```

### 3. Nhập dữ liệu mẫu

Sử dụng file `sample.sql` để nhập dữ liệu mẫu vào database:

```bash
# Thực hiện qua giao diện Supabase SQL Editor
# Hoặc sử dụng CLI:
supabase db execute < ./supabase/sample.sql
```

### 4. Để nhập dữ liệu từ JSON thông qua NodeJS

Bạn có thể sử dụng script sau để nhập dữ liệu từ file JSON:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Cấu hình Supabase
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Đọc dữ liệu từ file JSON
const jsonData = JSON.parse(fs.readFileSync('./app/dashboard/data.json', 'utf8'));

// Hàm nhập dữ liệu người dùng
async function importUsers() {
  const { data, error } = await supabase
    .from('users')
    .upsert(jsonData.users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      phone_number: user.phone_number,
      created_at: user.created_at,
      status: user.status,
      role: user.role
    })));
  
  if (error) console.error('Error importing users:', error);
  else console.log(`Imported ${jsonData.users.length} users successfully!`);
}

// Hàm nhập dữ liệu nhà hàng (cần thêm vào JSON)
async function importRestaurants() {
  // Tương tự như importUsers nhưng với dữ liệu nhà hàng
}

// Hàm nhập dữ liệu bàn
async function importTables() {
  const { data, error } = await supabase
    .from('tables')
    .upsert(jsonData.tables.map(table => ({
      table_id: table.table_id,
      restaurant_id: table.restaurant_id,
      table_number: table.table_number,
      capacity: table.capacity,
      description: table.description
    })));
  
  if (error) console.error('Error importing tables:', error);
  else console.log(`Imported ${jsonData.tables.length} tables successfully!`);
}

// Hàm nhập dữ liệu đặt bàn
async function importReservations() {
  const { data, error } = await supabase
    .from('reservations')
    .upsert(jsonData.reservations.map(reservation => ({
      reservation_id: reservation.reservation_id,
      user_id: reservation.user_id,
      restaurant_id: reservation.restaurant_id,
      table_id: reservation.table_id,
      guest_count: reservation.guest_count,
      reservation_date: reservation.reservation_date,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      created_at: reservation.created_at,
      status: reservation.status,
      notes: reservation.notes
    })));
  
  if (error) console.error('Error importing reservations:', error);
  else console.log(`Imported ${jsonData.reservations.length} reservations successfully!`);
}

// Thực thi nhập dữ liệu
async function importAllData() {
  await importUsers();
  // await importRestaurants(); // Nếu có dữ liệu nhà hàng
  await importTables();
  await importReservations();
  console.log('Data import completed!');
}

importAllData();
```

### 5. Xác minh dữ liệu

Sau khi nhập dữ liệu, bạn có thể kiểm tra trên giao diện Supabase hoặc sử dụng các lệnh SQL để xác minh dữ liệu đã được nhập đúng:

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM tables;
SELECT COUNT(*) FROM reservations;
```

## Tham khảo thêm

- [Tài liệu chính thức của Supabase](https://supabase.com/docs)
- [JavaScript Client Library](https://supabase.com/docs/reference/javascript/introduction) 