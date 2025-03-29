import { createClient as createServerClientFn } from './server';
import { createClient as createBrowserClient } from './client';

// Type definitions based on data.json structure
export type User = {
  id: string;
  email: string;
  name: string;
  phone_number: string;
  created_at: string;
  status: 'Active' | 'Inactive' | 'Pending';
  role: 'customer' | 'admin' | 'staff';
};

export type Restaurant = {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
};

export type Table = {
  table_id: number;
  restaurant_id: number;
  table_number: string;
  capacity: number;
  description: string | null;
};

export type Reservation = {
  reservation_id: number;
  user_id: string;
  restaurant_id: number;
  table_id: number;
  guest_count: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Arrived';
  notes: string | null;
};

// Helper function to determine if we are on the client-side
const isClient = typeof window !== 'undefined';

// Helper to create server client
const createServerClient = async () => {
  return await createServerClientFn();
};

// Fetchers for each table that work in both client and server components
export async function getUsers(): Promise<User[]> {
  const supabase = isClient ? createBrowserClient() : await createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data || [];
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = isClient ? createBrowserClient() : await createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching user ${id}:`, error);
    return null;
  }

  return data;
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const supabase = isClient ? createBrowserClient() : await createServerClient();
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }

  return data || [];
}

export async function getRestaurantById(id: number): Promise<Restaurant | null> {
  const supabase = isClient ? createBrowserClient() : await createServerClient();
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching restaurant ${id}:`, error);
    return null;
  }

  return data;
}

export async function getTables(restaurantId?: number): Promise<Table[]> {
  const supabase = isClient ? createBrowserClient() : await createServerClient();
  let query = supabase.from('tables').select('*');
  
  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId);
  }
  
  const { data, error } = await query.order('table_number');

  if (error) {
    console.error('Error fetching tables:', error);
    return [];
  }

  return data || [];
}

export async function getTableById(tableId: number): Promise<Table | null> {
  const supabase = isClient ? createBrowserClient() : await createServerClient();
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('table_id', tableId)
    .single();

  if (error) {
    console.error(`Error fetching table ${tableId}:`, error);
    return null;
  }

  return data;
}

export async function getReservations(filters?: { 
  userId?: string; 
  restaurantId?: number;
  tableId?: number;
  date?: string;
  status?: string;
}): Promise<Reservation[]> {
  const supabase = isClient ? createBrowserClient() : await createServerClient();
  let query = supabase.from('reservations').select('*');
  
  if (filters) {
    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.restaurantId) query = query.eq('restaurant_id', filters.restaurantId);
    if (filters.tableId) query = query.eq('table_id', filters.tableId);
    if (filters.date) query = query.eq('reservation_date', filters.date);
    if (filters.status) query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query.order('reservation_date', { ascending: true });

  if (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }

  return data || [];
}

export async function getReservationById(reservationId: number): Promise<Reservation | null> {
  const supabase = isClient ? createBrowserClient() : await createServerClient();
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_id', reservationId)
    .single();

  if (error) {
    console.error(`Error fetching reservation ${reservationId}:`, error);
    return null;
  }

  return data;
}

// Update functions
export async function updateReservationStatus(reservationId: number, status: string): Promise<boolean> {
  const supabase = isClient ? createBrowserClient() : await createServerClient();
  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('reservation_id', reservationId);

  if (error) {
    console.error(`Error updating reservation status ${reservationId}:`, error);
    return false;
  }

  return true;
}

// Create functions
export async function createReservation(reservation: Omit<Reservation, 'reservation_id' | 'created_at'>): Promise<Reservation | null> {
  const supabase = isClient ? createBrowserClient() : await createServerClient();
  const { data, error } = await supabase
    .from('reservations')
    .insert([reservation])
    .select()
    .single();

  if (error) {
    console.error('Error creating reservation:', error);
    return null;
  }

  return data;
} 