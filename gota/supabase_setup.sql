-- SUPABASE SETUP SQL - GOTA RESERVATION SYSTEM
-- Tệp này kết hợp tất cả các file thiết lập SQL cho dự án GOTA Reservation

-- ====================================================
-- FUNCTION HELPER
-- ====================================================

-- Tạo function helper cập nhật thời gian chỉnh sửa
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================
-- PHẦN 1: ADMIN MANAGEMENT
-- ====================================================

BEGIN;

-- Bảng quản lý role (vai trò)
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger cập nhật updated_at
DROP TRIGGER IF EXISTS update_admin_roles_updated_at ON admin_roles;
CREATE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Bảng quản lý admin
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES admin_roles(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger cập nhật updated_at
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Thiết lập RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin chỉ được xem và cập nhật thông tin của họ
DROP POLICY IF EXISTS "Admins can view all roles" ON admin_roles;
CREATE POLICY "Admins can view all roles" ON admin_roles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

DROP POLICY IF EXISTS "Admins can update their own profile" ON admin_users;
CREATE POLICY "Admins can update their own profile" ON admin_users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Tạo role mặc định cho admin
INSERT INTO admin_roles (name, description, permissions)
VALUES 
  ('Super Admin', 'Quản trị viên cao cấp với tất cả quyền hạn', '{"all": true}'::jsonb),
  ('Restaurant Manager', 'Quản lý nhà hàng, quản lý đặt bàn và nhân viên', '{"restaurants": true, "reservations": true, "tables": true, "users": true, "reports": true}'::jsonb),
  ('Reservation Manager', 'Quản lý đặt bàn', '{"reservations": true, "tables": true, "reports": {"view": true}}'::jsonb)
ON CONFLICT DO NOTHING;

-- Cho phép admins xem và quản lý tất cả profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

-- Cho phép admins quản lý restaurants
DROP POLICY IF EXISTS "Admins can manage restaurants" ON restaurants;
CREATE POLICY "Admins can manage restaurants" ON restaurants
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

-- Cho phép admins quản lý dishes
DROP POLICY IF EXISTS "Admins can manage dishes" ON dishes;
CREATE POLICY "Admins can manage dishes" ON dishes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

COMMIT;

-- ====================================================
-- PHẦN 2: TABLE MANAGEMENT
-- ====================================================

BEGIN;

-- Bảng quản lý bàn ăn
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  section TEXT,
  position JSONB, -- Lưu tọa độ vị trí trên sơ đồ
  status TEXT NOT NULL DEFAULT 'available', -- available, occupied, reserved, maintenance
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(restaurant_id, name)
);

-- Trigger cập nhật updated_at
DROP TRIGGER IF EXISTS update_tables_updated_at ON tables;
CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Thiết lập RLS
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Admins có thể xem và quản lý tất cả bàn
DROP POLICY IF EXISTS "Tables are viewable by everyone" ON tables;
CREATE POLICY "Tables are viewable by everyone" ON tables
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage tables" ON tables;
CREATE POLICY "Admins can manage tables" ON tables
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

-- Bổ sung bảng mapping giữa đặt bàn và bàn ăn
CREATE TABLE IF NOT EXISTS reservation_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reservation_id, table_id)
);

-- Thiết lập RLS
ALTER TABLE reservation_tables ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Reservation tables are viewable by everyone" ON reservation_tables;
CREATE POLICY "Reservation tables are viewable by everyone" ON reservation_tables
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage reservation tables" ON reservation_tables;
CREATE POLICY "Admins can manage reservation tables" ON reservation_tables
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

-- Bảng quản lý giờ mở cửa
CREATE TABLE IF NOT EXISTS opening_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0: Sunday, 1: Monday, etc.
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(restaurant_id, day_of_week)
);

-- Trigger cập nhật updated_at
DROP TRIGGER IF EXISTS update_opening_hours_updated_at ON opening_hours;
CREATE TRIGGER update_opening_hours_updated_at
  BEFORE UPDATE ON opening_hours
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Thiết lập RLS
ALTER TABLE opening_hours ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Opening hours are viewable by everyone" ON opening_hours;
CREATE POLICY "Opening hours are viewable by everyone" ON opening_hours
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage opening hours" ON opening_hours;
CREATE POLICY "Admins can manage opening hours" ON opening_hours
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

-- Bảng quản lý ngày đặc biệt (nghỉ lễ, sự kiện, v.v.)
CREATE TABLE IF NOT EXISTS special_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(restaurant_id, date)
);

-- Trigger cập nhật updated_at
DROP TRIGGER IF EXISTS update_special_dates_updated_at ON special_dates;
CREATE TRIGGER update_special_dates_updated_at
  BEFORE UPDATE ON special_dates
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Thiết lập RLS
ALTER TABLE special_dates ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Special dates are viewable by everyone" ON special_dates;
CREATE POLICY "Special dates are viewable by everyone" ON special_dates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage special dates" ON special_dates;
CREATE POLICY "Admins can manage special dates" ON special_dates
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

-- Cho phép admins xem và quản lý tất cả reservations
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
CREATE POLICY "Admins can view all reservations" ON reservations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

DROP POLICY IF EXISTS "Admins can manage all reservations" ON reservations;
CREATE POLICY "Admins can manage all reservations" ON reservations
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

-- Tạo bảng cancellation_requests
CREATE TABLE IF NOT EXISTS cancellation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Thiết lập Row Level Security (RLS)
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Tạo policies
DROP POLICY IF EXISTS "Users can view their own cancellation requests" ON cancellation_requests;
CREATE POLICY "Users can view their own cancellation requests" ON cancellation_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own cancellation requests" ON cancellation_requests;
CREATE POLICY "Users can insert their own cancellation requests" ON cancellation_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMIT;

-- ====================================================
-- PHẦN 3: SETTINGS, NOTIFICATIONS, LOGS & FUNCTIONS
-- ====================================================

BEGIN;

-- Bảng lưu cài đặt hệ thống
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(restaurant_id, key)
);

-- Trigger cập nhật updated_at
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Thiết lập RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Settings are viewable by admins" ON settings;
CREATE POLICY "Settings are viewable by admins" ON settings
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

-- Bảng quản lý thông báo
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL, -- system, reservation, marketing, etc.
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK ((user_id IS NULL AND admin_user_id IS NOT NULL) OR (user_id IS NOT NULL AND admin_user_id IS NULL))
);

-- Trigger cập nhật updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Thiết lập RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies cho khách hàng
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies cho admin
DROP POLICY IF EXISTS "Admins can view their own notifications" ON notifications;
CREATE POLICY "Admins can view their own notifications" ON notifications
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() 
    AND admin_users.id = notifications.admin_user_id
  ));

DROP POLICY IF EXISTS "Admins can update their own notifications" ON notifications;
CREATE POLICY "Admins can update their own notifications" ON notifications
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() 
    AND admin_users.id = notifications.admin_user_id
  ));

-- Bảng lưu nhật ký hoạt động
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL, -- Tên bảng hoặc entity liên quan
  entity_id UUID, -- ID của bản ghi liên quan
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Thiết lập RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Chỉ admins mới xem được logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

-- Function tạo audit log
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_admin_user_id UUID,
  p_action TEXT,
  p_entity TEXT,
  p_entity_id UUID,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, admin_user_id, action, entity, entity_id, 
    old_data, new_data, ip_address, user_agent
  ) VALUES (
    p_user_id, p_admin_user_id, p_action, p_entity, p_entity_id,
    p_old_data, p_new_data, p_ip_address, p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View thống kê đặt bàn
CREATE OR REPLACE VIEW reservation_statistics AS
SELECT
  r.restaurant_id,
  date_trunc('day', r.date) AS date,
  COUNT(*) AS total_reservations,
  SUM(CASE WHEN r.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_reservations,
  SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) AS pending_reservations,
  SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_reservations,
  SUM(r.number_of_people) AS total_guests,
  EXTRACT(DOW FROM r.date) AS day_of_week,
  EXTRACT(HOUR FROM (r.time::time)) AS hour_of_day
FROM reservations r
GROUP BY r.restaurant_id, date_trunc('day', r.date), EXTRACT(DOW FROM r.date), EXTRACT(HOUR FROM (r.time::time));

-- Function lấy thống kê tổng quan
CREATE OR REPLACE FUNCTION get_dashboard_statistics(p_restaurant_id UUID)
RETURNS TABLE (
  total_reservations BIGINT,
  today_reservations BIGINT,
  pending_reservations BIGINT,
  cancelled_reservations BIGINT,
  total_customers BIGINT,
  today_customers BIGINT,
  average_rating DECIMAL,
  total_reviews BIGINT,
  total_tables BIGINT,
  available_tables BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH today_data AS (
    SELECT 
      COUNT(*) AS today_res,
      SUM(number_of_people) AS today_cust,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_res,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_res
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
    AND date = CURRENT_DATE
  ),
  all_data AS (
    SELECT 
      COUNT(*) AS total_res,
      SUM(number_of_people) AS total_cust
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
  ),
  table_data AS (
    SELECT
      COUNT(*) AS total_tab,
      SUM(CASE WHEN status = 'available' AND is_active = true THEN 1 ELSE 0 END) AS avail_tab
    FROM tables
    WHERE restaurant_id = p_restaurant_id
  ),
  review_data AS (
    SELECT
      AVG(rating) AS avg_rating,
      COUNT(*) AS total_rev
    FROM reviews
    WHERE restaurant_id = p_restaurant_id
  )
  SELECT
    all_data.total_res,
    today_data.today_res,
    today_data.pending_res,
    today_data.cancelled_res,
    all_data.total_cust,
    today_data.today_cust,
    review_data.avg_rating,
    review_data.total_rev,
    table_data.total_tab,
    table_data.avail_tab
  FROM
    all_data,
    today_data,
    review_data,
    table_data;
END;
$$ LANGUAGE plpgsql;

-- Function lấy doanh thu theo ngày (nếu tích hợp module thanh toán)
CREATE OR REPLACE FUNCTION get_daily_revenue(
  p_restaurant_id UUID, 
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  total_reservations BIGINT,
  total_guests BIGINT,
  revenue DECIMAL
) AS $$
BEGIN
  -- Giả định có thông tin thanh toán
  RETURN QUERY
  SELECT
    date_trunc('day', r.date)::DATE,
    COUNT(r.id),
    SUM(r.number_of_people),
    0::DECIMAL -- Placeholder for revenue
  FROM reservations r
  WHERE r.restaurant_id = p_restaurant_id
  AND r.date BETWEEN p_start_date AND p_end_date
  AND r.status = 'confirmed'
  GROUP BY date_trunc('day', r.date)::DATE
  ORDER BY date_trunc('day', r.date)::DATE;
END;
$$ LANGUAGE plpgsql;

-- Function lấy thống kê đặt bàn theo giờ
CREATE OR REPLACE FUNCTION get_reservation_heatmap(
  p_restaurant_id UUID, 
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  p_end_date DATE DEFAULT CURRENT_DATE + INTERVAL '7 days'
)
RETURNS TABLE (
  day_of_week INTEGER,
  hour_of_day INTEGER,
  reservation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(DOW FROM r.date)::INTEGER,
    EXTRACT(HOUR FROM r.time::time)::INTEGER,
    COUNT(r.id)
  FROM reservations r
  WHERE r.restaurant_id = p_restaurant_id
  AND r.date BETWEEN p_start_date AND p_end_date
  GROUP BY EXTRACT(DOW FROM r.date), EXTRACT(HOUR FROM r.time::time)
  ORDER BY EXTRACT(DOW FROM r.date), EXTRACT(HOUR FROM r.time::time);
END;
$$ LANGUAGE plpgsql;

-- Trigger cập nhật trạng thái bàn khi có đặt bàn mới
CREATE OR REPLACE FUNCTION update_table_status_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu thêm mapping mới và đặt bàn có status là confirmed
  IF (TG_OP = 'INSERT') THEN
    IF EXISTS (SELECT 1 FROM reservations WHERE id = NEW.reservation_id AND status = 'confirmed') THEN
      UPDATE tables SET status = 'reserved' WHERE id = NEW.table_id;
    END IF;
  END IF;
  
  -- Nếu xóa mapping
  IF (TG_OP = 'DELETE') THEN
    -- Kiểm tra không có mapping nào khác đến bàn này
    IF NOT EXISTS (SELECT 1 FROM reservation_tables WHERE table_id = OLD.table_id) THEN
      UPDATE tables SET status = 'available' WHERE id = OLD.table_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_table_status_reservation_insert ON reservation_tables;
CREATE TRIGGER update_table_status_reservation_insert
  AFTER INSERT OR DELETE ON reservation_tables
  FOR EACH ROW EXECUTE FUNCTION update_table_status_on_reservation();

-- Trigger cập nhật trạng thái bàn khi cập nhật trạng thái đặt bàn
CREATE OR REPLACE FUNCTION update_table_status_on_reservation_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu đổi status từ pending sang confirmed
  IF (OLD.status = 'pending' AND NEW.status = 'confirmed') THEN
    UPDATE tables 
    SET status = 'reserved' 
    WHERE id IN (
      SELECT table_id FROM reservation_tables WHERE reservation_id = NEW.id
    );
  END IF;
  
  -- Nếu đổi status từ confirmed/pending sang cancelled
  IF ((OLD.status = 'confirmed' OR OLD.status = 'pending') AND NEW.status = 'cancelled') THEN
    UPDATE tables 
    SET status = 'available' 
    WHERE id IN (
      SELECT table_id FROM reservation_tables WHERE reservation_id = NEW.id
    );
    
    -- Xóa mapping
    DELETE FROM reservation_tables WHERE reservation_id = NEW.id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_table_status_reservation_update ON reservations;
CREATE TRIGGER update_table_status_reservation_update
  AFTER UPDATE OF status ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_table_status_on_reservation_update();

COMMIT;

-- ====================================================
-- PHẦN 4: HỖ TRỢ ỨNG DỤNG DI ĐỘNG
-- ====================================================

BEGIN;

-- Bảng quản lý thiết bị người dùng
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_token TEXT NOT NULL,
  device_type TEXT NOT NULL, -- android, ios
  device_name TEXT,
  app_version TEXT,
  is_active BOOLEAN DEFAULT true,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, device_token)
);

-- Trigger cập nhật updated_at
DROP TRIGGER IF EXISTS update_user_devices_updated_at ON user_devices;
CREATE TRIGGER update_user_devices_updated_at
  BEFORE UPDATE ON user_devices
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Thiết lập RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Policies cho user_devices
DROP POLICY IF EXISTS "Users can view their own devices" ON user_devices;
CREATE POLICY "Users can view their own devices" ON user_devices
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own devices" ON user_devices;
CREATE POLICY "Users can insert their own devices" ON user_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own devices" ON user_devices;
CREATE POLICY "Users can update their own devices" ON user_devices
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own devices" ON user_devices;
CREATE POLICY "Users can delete their own devices" ON user_devices
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all devices" ON user_devices;
CREATE POLICY "Admins can view all devices" ON user_devices
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

-- Bảng nhật ký đồng bộ hóa
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index cho sync_logs để tăng tốc độ tìm kiếm
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_table_record ON sync_logs(table_name, record_id);

-- Thiết lập RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies cho sync_logs
DROP POLICY IF EXISTS "Users can view relevant sync logs" ON sync_logs;
CREATE POLICY "Users can view relevant sync logs" ON sync_logs
  FOR SELECT USING (true); -- Mọi người đều có thể xem, dữ liệu được lọc khi query

DROP POLICY IF EXISTS "Admins can view all sync logs" ON sync_logs;
CREATE POLICY "Admins can view all sync logs" ON sync_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

-- Bảng yêu thích nhà hàng
CREATE TABLE IF NOT EXISTS restaurant_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, restaurant_id)
);

-- Thiết lập RLS
ALTER TABLE restaurant_favorites ENABLE ROW LEVEL SECURITY;

-- Policies cho restaurant_favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON restaurant_favorites;
CREATE POLICY "Users can view their own favorites" ON restaurant_favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON restaurant_favorites;
CREATE POLICY "Users can insert their own favorites" ON restaurant_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON restaurant_favorites;
CREATE POLICY "Users can delete their own favorites" ON restaurant_favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all favorites" ON restaurant_favorites;
CREATE POLICY "Admins can view all favorites" ON restaurant_favorites
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() AND admin_users.is_active = true
  ));

-- Cập nhật policies cho restaurants để hỗ trợ mobile
DROP POLICY IF EXISTS "Users can view public restaurants" ON restaurants;
CREATE POLICY "Users can view public restaurants" ON restaurants
  FOR SELECT USING (is_active = true OR auth.uid() IN (
    SELECT user_id FROM restaurant_favorites WHERE restaurant_id = restaurants.id
  ));

-- Cập nhật policies cho reservations để hỗ trợ mobile
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
CREATE POLICY "Users can view their own reservations" ON reservations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reservations" ON reservations;
CREATE POLICY "Users can insert their own reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;
CREATE POLICY "Users can update their own reservations" ON reservations
  FOR UPDATE USING (auth.uid() = user_id AND status <> 'cancelled');

-- Function lấy danh sách nhà hàng gần đây
CREATE OR REPLACE FUNCTION get_nearby_restaurants(
  p_lat FLOAT, 
  p_lng FLOAT, 
  p_radius FLOAT DEFAULT 5.0,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  cuisine_type TEXT,
  price_range TEXT,
  rating NUMERIC,
  lat FLOAT,
  lng FLOAT,
  distance FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    r.address,
    r.phone,
    r.email,
    r.website,
    r.cuisine_type,
    r.price_range,
    COALESCE((SELECT AVG(rating) FROM reviews WHERE restaurant_id = r.id), 0) as rating,
    r.lat,
    r.lng,
    (6371 * acos(cos(radians(p_lat)) * cos(radians(r.lat)) * cos(radians(r.lng) - radians(p_lng)) + sin(radians(p_lat)) * sin(radians(r.lat)))) AS distance
  FROM restaurants r
  WHERE r.is_active = true
  AND (6371 * acos(cos(radians(p_lat)) * cos(radians(r.lat)) * cos(radians(r.lng) - radians(p_lng)) + sin(radians(p_lat)) * sin(radians(r.lat)))) <= p_radius
  ORDER BY distance
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function lấy thông tin đồng bộ hóa
CREATE OR REPLACE FUNCTION get_changes_since(p_last_sync TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
  table_name TEXT,
  record_id UUID,
  operation TEXT,
  data JSONB,
  sync_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.table_name,
    sl.record_id,
    sl.operation,
    CASE 
      WHEN sl.operation = 'DELETE' THEN sl.old_data
      ELSE COALESCE(sl.new_data, '{}')
    END as data,
    sl.created_at as sync_time
  FROM sync_logs sl
  WHERE sl.created_at > p_last_sync
  ORDER BY sl.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function tạo sync log
CREATE OR REPLACE FUNCTION create_sync_log()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data JSONB := NULL;
  v_new_data JSONB := NULL;
BEGIN
  -- Lấy dữ liệu cũ và mới
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
    v_old_data := to_jsonb(OLD);
  END IF;
  
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    v_new_data := to_jsonb(NEW);
  END IF;
  
  -- Thêm vào bảng sync_logs
  INSERT INTO sync_logs (
    table_name, 
    record_id,
    operation,
    changed_by,
    old_data,
    new_data
  ) VALUES (
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN (v_old_data->>'id')::UUID
      ELSE (v_new_data->>'id')::UUID
    END,
    TG_OP,
    auth.uid(),
    v_old_data,
    v_new_data
  );
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger cho các bảng cần đồng bộ
DO $$
DECLARE
  tables TEXT[] := ARRAY['restaurants', 'tables', 'reservations', 'reviews', 'restaurant_favorites'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS sync_log_trigger ON %I', t);
    EXECUTE format('CREATE TRIGGER sync_log_trigger AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION create_sync_log()', t);
  END LOOP;
END;
$$;

-- Function tạo thông báo khi có đặt bàn mới hoặc cập nhật
CREATE OR REPLACE FUNCTION notify_reservation_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu là đặt bàn mới
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO notifications (
      user_id,
      title,
      content,
      type
    ) VALUES (
      NEW.user_id,
      'Đặt bàn thành công',
      'Bạn đã đặt bàn thành công tại nhà hàng. Vui lòng chờ xác nhận.',
      'reservation'
    );
    
    -- Thông báo cho admin của nhà hàng
    INSERT INTO notifications (
      admin_user_id,
      title,
      content,
      type
    ) 
    SELECT
      au.id,
      'Có đặt bàn mới',
      'Có đơn đặt bàn mới từ khách hàng. Vui lòng kiểm tra.',
      'reservation'
    FROM admin_users au
    JOIN admin_roles ar ON au.role_id = ar.id
    WHERE ar.permissions::jsonb ? 'reservations'
    AND au.is_active = true;
  END IF;
  
  -- Nếu cập nhật trạng thái đặt bàn
  IF (TG_OP = 'UPDATE' AND OLD.status <> NEW.status) THEN
    INSERT INTO notifications (
      user_id,
      title,
      content,
      type
    ) VALUES (
      NEW.user_id,
      'Trạng thái đặt bàn đã thay đổi',
      'Đơn đặt bàn của bạn đã được cập nhật thành ' || NEW.status,
      'reservation'
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger vào bảng reservations
DROP TRIGGER IF EXISTS reservation_notification_trigger ON reservations;
CREATE TRIGGER reservation_notification_trigger
  AFTER INSERT OR UPDATE OF status ON reservations
  FOR EACH ROW EXECUTE FUNCTION notify_reservation_change();

COMMIT;

-- ====================================================
-- HƯỚNG DẪN SỬ DỤNG
-- ====================================================

/*
HƯỚNG DẪN THIẾT LẬP TRÊN SUPABASE:

1. Tạo dự án Supabase mới hoặc sử dụng dự án hiện có

2. Mở SQL Editor trong Supabase Dashboard 

3. Sao chép và dán toàn bộ nội dung của file này vào SQL Editor

4. Chạy từng phần một theo thứ tự:
   - FUNCTION HELPER
   - PHẦN 1: ADMIN MANAGEMENT
   - PHẦN 2: TABLE MANAGEMENT
   - PHẦN 3: SETTINGS, NOTIFICATIONS, LOGS & FUNCTIONS
   - PHẦN 4: HỖ TRỢ ỨNG DỤNG DI ĐỘNG

5. Sau khi chạy xong, kiểm tra trong phần Database để đảm bảo tất cả các bảng và 
   chức năng đã được tạo thành công

6. Tạo tài khoản admin đầu tiên:
   - Tạo một người dùng mới trong Authentication
   - Thêm record vào bảng admin_users qua SQL hoặc Table Editor với role_id là Super Admin

LƯU Ý:
- Trước khi chạy script này, bạn phải đảm bảo đã tạo các bảng cơ bản như 
  restaurants, profiles, dishes, reservation, reviews, ... trước đó.
- Script này bổ sung các bảng và chức năng phục vụ cho Web Admin Dashboard và Ứng dụng Di động.
- Đảm bảo function update_modified_column() đã tồn tại trước khi chạy các phần tiếp theo.
*/
