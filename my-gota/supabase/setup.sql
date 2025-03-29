-- Tạo bảng users
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    phone_number VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now(),
    status VARCHAR CHECK (status IN ('Active', 'Inactive', 'Pending')) DEFAULT 'Active',
    role VARCHAR DEFAULT 'customer'
);

-- Tạo bảng restaurants
CREATE TABLE restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    address VARCHAR NOT NULL,
    phone VARCHAR,
    email VARCHAR,
    description TEXT,
    opening_hours VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now(),
    status VARCHAR CHECK (status IN ('Active', 'Inactive', 'Pending')) DEFAULT 'Active'
);

-- Tạo bảng tables
CREATE TABLE tables (
    table_id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    table_number VARCHAR NOT NULL,
    capacity INTEGER CHECK (capacity > 0),
    description TEXT,
    UNIQUE(restaurant_id, table_number)
);

-- Tạo bảng reservations
CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    restaurant_id INTEGER REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    table_id INTEGER REFERENCES tables(table_id) ON DELETE SET NULL,
    guest_count INTEGER CHECK (guest_count > 0),
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    status VARCHAR CHECK (status IN ('Confirmed', 'Pending', 'Cancelled', 'Completed', 'Arrived')) DEFAULT 'Pending',
    notes TEXT
);

-- Index for performance
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_restaurant ON reservations(restaurant_id);
CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Function to check for table availability
CREATE OR REPLACE FUNCTION is_table_available(
    p_table_id INTEGER,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_current_reservation_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflicting_count INTEGER;
BEGIN
    -- Count conflicts
    SELECT COUNT(*)
    INTO conflicting_count
    FROM reservations
    WHERE
        table_id = p_table_id AND
        reservation_date = p_date AND
        status != 'Cancelled' AND
        (
            (start_time < p_end_time AND end_time > p_start_time) OR
            (start_time = p_start_time) OR
            (end_time = p_end_time)
        ) AND
        (p_current_reservation_id IS NULL OR reservation_id != p_current_reservation_id);
    
    -- Return true if no conflicts
    RETURN conflicting_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check table availability before insert/update
CREATE OR REPLACE FUNCTION check_table_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT is_table_available(
        NEW.table_id,
        NEW.reservation_date,
        NEW.start_time,
        NEW.end_time,
        NEW.reservation_id
    ) THEN
        RAISE EXCEPTION 'Table is already booked during this time period';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_table_availability
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION check_table_availability();

-- Create RLS policies
-- Users policy
CREATE POLICY users_select_policy ON users
    FOR SELECT USING (true);  -- Anyone can view users

CREATE POLICY users_insert_policy ON users
    FOR INSERT WITH CHECK (auth.uid() = id);  -- Only allow creating own account

CREATE POLICY users_update_policy ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);  -- Only update own account

-- Restaurants policies
CREATE POLICY restaurants_select_policy ON restaurants
    FOR SELECT USING (true);  -- Anyone can view restaurants

-- Tables policies
CREATE POLICY tables_select_policy ON tables
    FOR SELECT USING (true);  -- Anyone can view tables

-- Reservations policies
CREATE POLICY reservations_select_own_policy ON reservations
    FOR SELECT USING (auth.uid() = user_id);  -- User can only view own reservations

CREATE POLICY reservations_insert_own_policy ON reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);  -- User can only create own reservations

CREATE POLICY reservations_update_own_policy ON reservations
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);  -- User can only update own reservations

-- Admin role and policies would be added as needed 