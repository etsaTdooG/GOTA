'use client';

import { useEffect, useState, useCallback } from "react";
import { DataTable } from "@/components/data-table";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/supabase/database";
import { toast } from "sonner";

export default function Page() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        throw countError;
      }
      
      if (count !== null) {
        setTotalCount(count);
      }
      
      const { data, error: dataError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);
      
      if (dataError) {
        throw dataError;
      }
      
      setUsers(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize]);
  
  useEffect(() => {
    fetchUsers();
    
    const supabase = createClient();
    
    // Thiết lập real-time subscription để cập nhật tự động khi database thay đổi
    const channel = supabase
      .channel('public:users')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, () => {
        fetchUsers();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageIndex, pageSize, fetchUsers]);
  
  const onPageChange = (newPageIndex: number, newPageSize: number) => {
    setPageIndex(newPageIndex);
    setPageSize(newPageSize);
  };
  
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
      ) : error ? (
        <div className="flex items-center justify-center h-[200px] text-destructive">
          <p>{error}</p>
        </div>
      ) : (
        <DataTable 
          data={users} 
          pagination={{
            pageIndex,
            pageSize,
            totalCount,
            onPageChange
          }}
        />
      )}
    </div>
  );
}
