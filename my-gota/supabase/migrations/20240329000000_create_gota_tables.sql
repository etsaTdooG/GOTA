-- Migration file to create GOTA restaurant reservation tables
-- Created: 2024-03-29

-- Create users table
create table if not exists public.users (
  id text primary key,
  email text unique not null,
  name text not null,
  phone_number text,
  created_at timestamp with time zone default now() not null,
  status text default 'Active' check (status in ('Active', 'Inactive', 'Pending')),
  role text default 'customer' check (role in ('customer', 'admin', 'staff'))
);
comment on table public.users is 'Stores user information for the GOTA restaurant system';

-- Create restaurants table
create table if not exists public.restaurants (
  id bigint generated always as identity primary key,
  name text not null,
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
comment on table public.restaurants is 'Stores restaurant locations information';

-- Create tables table
create table if not exists public.tables (
  table_id bigint generated always as identity primary key,
  restaurant_id bigint references public.restaurants(id) not null,
  table_number text not null,
  capacity integer not null,
  description text,
  unique(restaurant_id, table_number)
);
comment on table public.tables is 'Stores restaurant tables information';

-- Create reservations table
create table if not exists public.reservations (
  reservation_id bigint generated always as identity primary key,
  user_id text references public.users(id) not null,
  restaurant_id bigint references public.restaurants(id) not null,
  table_id bigint references public.tables(table_id) not null,
  guest_count integer not null,
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default now() not null,
  status text default 'Pending' check (status in ('Pending', 'Confirmed', 'Cancelled', 'Completed', 'Arrived')),
  notes text
);
comment on table public.reservations is 'Stores reservation information for restaurant tables';

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.restaurants enable row level security;
alter table public.tables enable row level security;
alter table public.reservations enable row level security;

-- Create basic policies (public read access for now, you can modify these as needed)
create policy "Anyone can view users" on public.users for select using (true);
create policy "Anyone can view restaurants" on public.restaurants for select using (true);
create policy "Anyone can view tables" on public.tables for select using (true);
create policy "Anyone can view reservations" on public.reservations for select using (true); 