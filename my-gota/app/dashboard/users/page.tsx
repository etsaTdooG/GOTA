'use client';

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/supabase/database";

export default function Page() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchUsers() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching users:', error);
          return;
        }
        
        setUsers(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUsers();
  }, []);
  
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Users</h1>
        <p className="text-muted-foreground mb-6">Manage user accounts and permissions</p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DataTable data={users} />
      )}
    </div>
  );
}
