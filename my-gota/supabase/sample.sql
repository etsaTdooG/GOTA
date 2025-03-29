-- Sample data for restaurants
INSERT INTO restaurants (restaurant_id, name, address, phone, email, description, opening_hours, status)
VALUES
    (1, 'Nhà hàng Việt', '123 Đường Lê Lợi, Quận 1, TP.HCM', '+84901234567', 'info@nhahangviet.com', 'Nhà hàng đặc sản Việt Nam', '10:00 - 22:00', 'Active'),
    (2, 'Quán Ẩm Thực Á Đông', '456 Đường Nguyễn Huệ, Quận 1, TP.HCM', '+84912345678', 'info@amthucadong.com', 'Quán ăn phong cách Á Đông', '11:00 - 23:00', 'Active'),
    (3, 'Grill House', '789 Đường Lý Tự Trọng, Quận 1, TP.HCM', '+84923456789', 'info@grillhouse.com', 'Nhà hàng nướng phong cách Âu Mỹ', '16:00 - 23:00', 'Active');

-- Sample insert for users
INSERT INTO users (id, email, name, phone_number, created_at, status, role)
VALUES
    ('user-1', 'user1@example.com', 'User One', '+84123456789', '2024-12-20T10:00:00Z', 'Active', 'customer'),
    ('user-2', 'user2@example.com', 'User Two', '+84987654321', '2025-01-05T11:30:00Z', 'Active', 'customer'),
    ('user-3', 'user3@example.com', 'User Three', '+84112233445', '2025-01-15T09:45:00Z', 'Inactive', 'customer');

-- Sample insert for tables
INSERT INTO tables (table_id, restaurant_id, table_number, capacity, description)
VALUES
    (1, 1, '1', 4, 'Bàn cạnh cửa sổ, view đẹp.'),
    (2, 1, '2', 2, 'Bàn đôi yên tĩnh ở góc.'),
    (3, 1, '3', 6, 'Bàn tròn lớn, phù hợp cho gia đình.'),
    (11, 2, '1', 4, 'Bàn cạnh cửa sổ, view đẹp.'),
    (12, 2, '2', 2, 'Bàn đôi yên tĩnh ở góc.'),
    (21, 3, '1', 4, 'Bàn cạnh cửa sổ, view đẹp.');

-- Sample insert for reservations
INSERT INTO reservations (reservation_id, user_id, restaurant_id, table_id, guest_count, reservation_date, start_time, end_time, created_at, status, notes)
VALUES
    (1, 'user-1', 1, 1, 4, '2025-01-05', '19:00:00', '20:30:00', '2024-12-30T17:00:00Z', 'Confirmed', 'Không yêu cầu đặc biệt.'),
    (2, 'user-2', 2, 11, 3, '2025-01-10', '20:00:00', '21:30:00', '2025-01-03T17:30:00Z', 'Confirmed', 'Cần không gian yên tĩnh.'),
    (3, 'user-3', 3, 21, 2, '2025-01-15', '18:00:00', '19:00:00', '2025-01-08T17:45:00Z', 'Cancelled', 'Hủy do thay đổi lịch trình.');

-- Sử dụng HỒI QUI PostgreSQL để nhập dữ liệu từ JSON
-- Phần này sẽ cần thực hiện bên ngoài SQL thông qua Node.js hoặc công cụ khác

-- Dưới đây là mã SQL để tải dữ liệu từ JSON nếu bạn đã đưa nó vào bảng tạm

-- Ví dụ: Nếu bạn đã đưa JSON vào bảng tạm json_import
/*
CREATE TEMP TABLE json_import (data JSONB);
COPY json_import FROM '/path/to/data.json';

-- Import users
INSERT INTO users
SELECT 
    (data->>'id')::VARCHAR AS id,
    (data->>'email')::VARCHAR AS email,
    (data->>'name')::VARCHAR AS name,
    (data->>'phone_number')::VARCHAR AS phone_number,
    (data->>'created_at')::TIMESTAMPTZ AS created_at,
    (data->>'status')::VARCHAR AS status,
    (data->>'role')::VARCHAR AS role
FROM json_import, jsonb_array_elements(data->'users') as data
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone_number = EXCLUDED.phone_number,
    created_at = EXCLUDED.created_at,
    status = EXCLUDED.status,
    role = EXCLUDED.role;

-- Import tables
INSERT INTO tables
SELECT 
    (data->>'table_id')::INTEGER AS table_id,
    (data->>'restaurant_id')::INTEGER AS restaurant_id,
    (data->>'table_number')::VARCHAR AS table_number,
    (data->>'capacity')::INTEGER AS capacity,
    (data->>'description')::TEXT AS description
FROM json_import, jsonb_array_elements(data->'tables') as data
ON CONFLICT (table_id) DO UPDATE
SET 
    restaurant_id = EXCLUDED.restaurant_id,
    table_number = EXCLUDED.table_number,
    capacity = EXCLUDED.capacity,
    description = EXCLUDED.description;

-- Import reservations
INSERT INTO reservations
SELECT 
    (data->>'reservation_id')::INTEGER AS reservation_id,
    (data->>'user_id')::VARCHAR AS user_id,
    (data->>'restaurant_id')::INTEGER AS restaurant_id,
    (data->>'table_id')::INTEGER AS table_id,
    (data->>'guest_count')::INTEGER AS guest_count,
    (data->>'reservation_date')::DATE AS reservation_date,
    (data->>'start_time')::TIME AS start_time,
    (data->>'end_time')::TIME AS end_time,
    (data->>'created_at')::TIMESTAMPTZ AS created_at,
    (data->>'status')::VARCHAR AS status,
    (data->>'notes')::TEXT AS notes
FROM json_import, jsonb_array_elements(data->'reservations') as data
ON CONFLICT (reservation_id) DO UPDATE
SET 
    user_id = EXCLUDED.user_id,
    restaurant_id = EXCLUDED.restaurant_id,
    table_id = EXCLUDED.table_id,
    guest_count = EXCLUDED.guest_count,
    reservation_date = EXCLUDED.reservation_date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    created_at = EXCLUDED.created_at,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes;
*/

-- Script có thể dùng trong Supabase SQL Editor
-- Để import từ JSON, bạn nên sử dụng Node.js script trong README.md 