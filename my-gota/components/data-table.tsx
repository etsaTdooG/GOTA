"use client"

import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconGripVertical,
  IconLayoutColumns,
  IconTrash,
  IconTrendingUp,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { createClient } from "@/lib/supabase/client"

export const schema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  phone_number: z.string(),
  created_at: z.string(),
  status: z.enum(['Active', 'Inactive', 'Pending']),
  role: z.enum(['customer', 'admin', 'staff']).optional()
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 px-0 font-medium"
        >
          Name
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconSortAscending className="ml-2 h-4 w-4 opacity-30" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 px-0 font-medium"
        >
          Email
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconSortAscending className="ml-2 h-4 w-4 opacity-30" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="max-w-[180px] min-w-[120px] sm:w-auto">
        <Badge 
          variant="outline" 
          className="text-muted-foreground px-1.5 w-full text-left"
          title={row.original.email}
          data-user-email={row.original.id}
        >
          <span className="block truncate">
            {row.original.email}
          </span>
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 px-0 font-medium"
        >
          Status
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconSortAscending className="ml-2 h-4 w-4 opacity-30" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.original.status;
      let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
      let badgeClass = "";
      
      // Customize badge styles based on status
      if (status === "Active") {
        badgeVariant = "default";
        badgeClass = "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20";
      } else if (status === "Inactive") {
        badgeVariant = "secondary";
        badgeClass = "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/20";
      } else if (status === "Pending") {
        badgeVariant = "secondary";
        badgeClass = "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      }
      
      return (
        <Badge 
          variant={badgeVariant} 
          className={badgeClass}
          data-user-status={row.original.id}
          data-status-value={status}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "phone_number",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 px-0 font-medium"
        >
          Phone Number
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconSortAscending className="ml-2 h-4 w-4 opacity-30" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="max-w-[120px] overflow-hidden whitespace-nowrap">
        <Badge 
          variant="outline" 
          className="text-muted-foreground px-1.5 overflow-hidden text-ellipsis"
          data-user-phone={row.original.id}
        >
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 shrink-0 mr-1" />
          <span className="truncate">{row.original.phone_number}</span>
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 px-0 font-medium ml-auto"
          >
            Created At
            {column.getIsSorted() === "asc" ? (
              <IconSortAscending className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <IconSortDescending className="ml-2 h-4 w-4" />
            ) : (
              <IconSortAscending className="ml-2 h-4 w-4 opacity-30" />
            )}
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      // Format date for display
      const formattedDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(new Date(row.original.created_at));
      
      return (
        <div className="text-right">
          {formattedDate}
        </div>
      );
    },
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data: initialData,
  onUpdate,
  pagination,
}: {
  data: z.infer<typeof schema>[]
  onUpdate?: (userId: string, userData: Partial<z.infer<typeof schema>>) => Promise<boolean>
  pagination?: {
    pageIndex: number
    pageSize: number
    totalCount: number
    onPageChange: (pageIndex: number, pageSize: number) => void
  }
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [paginationState, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  // Set up real-time subscription
  React.useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to changes on the users table
    const subscription = supabase
      .channel('users-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, (payload: {eventType: string, old: Record<string, unknown>, new: Record<string, unknown>}) => {
        console.log('Real-time update received:', payload);
        
        // Handle different types of changes
        if (payload.eventType === 'DELETE') {
          // Remove the deleted user from the data
          setData(prev => prev.filter(user => user.id !== payload.old.id));
          // Clear selection if the deleted user was selected
          setRowSelection(prev => {
            const newSelection = {...prev};
            if (payload.old && payload.old.id && newSelection[payload.old.id as keyof typeof newSelection]) {
              delete newSelection[payload.old.id as keyof typeof newSelection];
            }
            return newSelection;
          });
        } else if (payload.eventType === 'INSERT') {
          // Add the new user to the data
          setData(prev => [...prev, payload.new as z.infer<typeof schema>]);
        } else if (payload.eventType === 'UPDATE') {
          // Update the existing user in the data
          setData(prev => prev.map(user => 
            user.id === payload.new.id ? payload.new as z.infer<typeof schema> : user
          ));
        }
      })
      .subscribe();
    
    // Set up event listener for refresh
    const handleRefreshEvent = (event: CustomEvent) => {
      console.log('Custom refresh event received', event.detail);
      if (event.detail && event.detail.data) {
        setData(event.detail.data as z.infer<typeof schema>[]);
      }
    };
    
    // Add event listener
    window.addEventListener('refreshUsersData', handleRefreshEvent as EventListener);
    
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('refreshUsersData', handleRefreshEvent as EventListener);
    };
  }, []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: paginationState,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  // Function to delete selected rows
  async function deleteSelectedRows() {
    const selectedRowIds = Object.keys(rowSelection);
    
    try {
      console.log('Deleting users with IDs:', selectedRowIds);
      
      const supabase = createClient();
      
      // Check Supabase connection
      const { data: authData } = await supabase.auth.getSession();
      console.log('Auth check:', authData ? 'Connected' : 'Not connected');
      
      // First, delete any associated reservations
      for (const id of selectedRowIds) {
        console.log(`Checking for reservations for user ID: ${id}`);
        
        // Delete associated reservations first
        const { error: reservationDeleteError } = await supabase
          .from('reservations')
          .delete()
          .eq('user_id', id);
          
        if (reservationDeleteError) {
          console.error(`Failed to delete reservations for user ${id}:`, reservationDeleteError);
        }
      }
      
      // Then attempt to delete the users
      const results = await Promise.all(
        selectedRowIds.map(async (id) => {
          console.log(`Attempting to delete user with ID: ${id}`);
          
          const { error, status, statusText } = await supabase
            .from('users')
            .delete()
            .eq('id', id);
            
          // Log deletion result
          console.log(`Delete result for ID ${id}:`, { error, status, statusText });
          
          if (error) {
            return { id, success: false, error, status };
          }
          
          return { id, success: true, status };
        })
      );
      
      // Analyze results
      const failures = results.filter(r => !r.success);
      
      if (failures.length > 0) {
        console.error('Failed to delete some users:', failures);
        const failedIds = failures.map(f => f.id).join(', ');
        toast.error(`Failed to delete users: ${failedIds}. Please check console for details.`);
      } else {
        // Clear row selection
        setRowSelection({});
        toast.success(`${selectedRowIds.length} user(s) deleted successfully`);
        
        // Note: We no longer need to update local state here since the subscription will do it
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete users';
      toast.error(`Error: ${errorMessage}`);
      console.error('Error deleting users:', error);
    }
  }

  const hasSelectedRows = Object.keys(rowSelection).length > 0;

  // Update this function to support external pagination
  function handlePaginationChange(pageIndex: number, pageSize: number) {
    if (pagination) {
      // Use external pagination if available
      pagination.onPageChange(pageIndex, pageSize);
    } else {
      // Use internal pagination
      setPagination({
        pageIndex,
        pageSize
      });
    }
  }

  // Luôn cập nhật dữ liệu từ props
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  return (
    <Tabs
      defaultValue="users-table"
      className="w-full flex-col justify-start gap-6"
      data-datatable
      data-update-prop={onUpdate ? "true" : "false"}
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="users-table">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="users-table">Users Table</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="users-table">Users Table</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          {hasSelectedRows && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <IconTrash className="size-4 mr-2" />
                  <span>Delete Selected</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {Object.keys(rowSelection).length} selected user(s)? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteSelectedRows}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <TabsContent
        value="users-table"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${pagination?.pageSize || table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  const newPageSize = Number(value);
                  if (pagination) {
                    pagination.onPageChange(pagination.pageIndex, newPageSize);
                  } else {
                    table.setPageSize(newPageSize);
                  }
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={pagination?.pageSize || table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {(pagination?.pageIndex || table.getState().pagination.pageIndex) + 1} of{" "}
              {pagination 
                ? Math.ceil(pagination.totalCount / pagination.pageSize) || 1
                : table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => handlePaginationChange(0, pagination?.pageSize || table.getState().pagination.pageSize)}
                disabled={pagination ? pagination.pageIndex === 0 : !table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => {
                  const currentIndex = pagination?.pageIndex || table.getState().pagination.pageIndex;
                  handlePaginationChange(currentIndex - 1, pagination?.pageSize || table.getState().pagination.pageSize);
                }}
                disabled={pagination ? pagination.pageIndex === 0 : !table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => {
                  const currentIndex = pagination?.pageIndex || table.getState().pagination.pageIndex;
                  const pageSize = pagination?.pageSize || table.getState().pagination.pageSize;
                  handlePaginationChange(currentIndex + 1, pageSize);
                }}
                disabled={pagination 
                  ? (pagination.pageIndex + 1) * pagination.pageSize >= pagination.totalCount
                  : !table.getCanNextPage()
                }
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => {
                  const pageSize = pagination?.pageSize || table.getState().pagination.pageSize;
                  const lastPageIndex = pagination
                    ? Math.max(0, Math.ceil(pagination.totalCount / pageSize) - 1)
                    : table.getPageCount() - 1;
                  handlePaginationChange(lastPageIndex, pageSize);
                }}
                disabled={pagination
                  ? (pagination.pageIndex + 1) * pagination.pageSize >= pagination.totalCount
                  : !table.getCanNextPage()
                }
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

const chartConfig = {
  desktop: {
    label: "Activity",
    color: "var(--primary)",
  },
  mobile: {
    label: "Guests",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile()
  const [chartData, setChartData] = React.useState<Array<{month: string, desktop: number, mobile: number}>>([])
  const [trendingValue, setTrendingValue] = React.useState<number>(0)
  const [isDataLoaded, setIsDataLoaded] = React.useState(false)
  const isOpen = true // Always open in this component
  
  // Use React.useCallback to memoize the function
  const loadReservationsData = React.useCallback(async () => {
    try {
      // Use Supabase client directly
      const supabase = createClient();
      const { data: reservationsData, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', item.id);
      
      if (error) {
        console.error(`Error fetching reservations for user ${item.id}:`, error);
        setChartData([]);
        setTrendingValue(0);
        setIsDataLoaded(true);
        return;
      }
      
      console.log(`User ${item.name} (${item.id}) - Loading data...`);
      
      // Get reservations for this user - we've already filtered by userId in the query
      const userReservations = reservationsData || [];
  
      if (userReservations.length === 0) {
        setChartData([]);
        setTrendingValue(0);
        setIsDataLoaded(true);
        return;
      }
      
      // Get all unique months from the reservations data
      const allMonths = userReservations.map(res => {
        const date = new Date(res.created_at);
        return `${date.getFullYear()}-${date.getMonth()}`;
      });
      
      // Get unique months (remove duplicates)
      const uniqueMonths = [...new Set(allMonths)];
      
      // Sort months chronologically
      uniqueMonths.sort();
      
      // Get the last 6 months of data or all if less than 6
      let monthsToUse = uniqueMonths;
      if (uniqueMonths.length > 6) {
        monthsToUse = uniqueMonths.slice(-6); // Get the last 6 months
      }
      
      // Generate chart data based on these actual months
      const newChartData = monthsToUse.map(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        
        // Create date objects for first and last day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Month name for display
        const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        // Filter reservations for this month
        const monthReservations = userReservations.filter(res => {
          const resDate = new Date(res.created_at);
          return resDate >= firstDay && resDate <= lastDay;
        });
        
        // Count of reservations for the month
        const activityCount = monthReservations.length;
        
        // Sum of guests for the month
        const guestCount = monthReservations.reduce((sum, res) => 
          sum + res.guest_count, 0);
        
        console.log(`${item.name} - ${monthName}: ${activityCount} reservations, ${guestCount} guests`);
          
        return {
          month: monthName,
          desktop: activityCount, // Activity count
          mobile: guestCount      // Guest count
        };
      });
      
      setChartData(newChartData);
      
      // Calculate trending percentage
      if (newChartData.length >= 2) {
        const currentMonth = {
          activity: newChartData[newChartData.length - 1].desktop,
          guests: newChartData[newChartData.length - 1].mobile
        };
        
        const prevMonth = {
          activity: newChartData[newChartData.length - 2].desktop,
          guests: newChartData[newChartData.length - 2].mobile
        };
        
        // Use combined metric for trend
        const currentTotal = currentMonth.activity + currentMonth.guests * 0.5;
        const prevTotal = prevMonth.activity + prevMonth.guests * 0.5;
        
        if (prevTotal === 0) {
          // Avoid division by zero
          setTrendingValue(currentTotal > 0 ? 100 : 0);
        } else {
          const percentChange = ((currentTotal - prevTotal) / prevTotal) * 100;
          setTrendingValue(Number(percentChange.toFixed(1)));
        }
        
        console.log(`Trend for ${item.name}: ${currentTotal} vs ${prevTotal} = ${trendingValue}%`);
      }
      
      setIsDataLoaded(true);
    } catch (error) {
      console.error("Error loading reservation data:", error);
      
      // Just show empty data instead of fake data
      setChartData([]);
      setTrendingValue(0);
      setIsDataLoaded(true);
    }
  }, [item, setTrendingValue, trendingValue]); // Add trendingValue to dependencies
  
  // React hook for dynamic data loading
  React.useEffect(() => {
    const loadReservations = async () => {
      if (!isOpen) {
        // No need to load data if the drawer is closed
        return;
      }
      
      await loadReservationsData();
    };
    
    loadReservations();
  }, [isOpen, loadReservationsData]); // Dependencies include loadReservationsData

  // Add these states for form handling
  const [formValues, setFormValues] = React.useState({
    name: item.name,
    email: item.email,
    status: item.status,
    phone_number: item.phone_number
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Handle form changes
  const handleFormChange = (field: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Form submitted with data:', formValues);
      console.log('User ID being updated:', item.id);
      
      const supabase = createClient();
      
      // Create the user data update object
      const updatedUserData = {
        name: formValues.name,
        email: formValues.email, 
        status: formValues.status as 'Active' | 'Inactive' | 'Pending',
        phone_number: formValues.phone_number
      };
      
      console.log('Sending update to Supabase:', updatedUserData);
      
      // Simple table test to check connection
      const { error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
        
      if (testError) {
        throw new Error(`Failed to connect to Supabase: ${testError.message}`);
      }
      
      // Update the user in Supabase
      const { data, error } = await supabase
        .from('users')
        .update(updatedUserData)
        .eq('id', item.id)
        .select();
      
      console.log('Update response:', { data, error });
      
      if (error) {
        throw error;
      }
      
      console.log('User updated successfully');
      toast.success('User updated successfully');
      
      // Manually trigger a refresh after successful update
      await (async () => {
        try {
          const { data: refreshedData, error: refreshError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (refreshError) {
            console.error('Error refreshing data:', refreshError);
            return;
          }
          
          // Use a custom event to notify parent component to refresh data
          if (refreshedData) {
            // Use the window object to dispatch the event
            window.dispatchEvent(new CustomEvent('refreshUsersData', { 
              detail: { data: refreshedData } 
            }));
          }
        } catch (refreshErr) {
          console.error('Error refreshing data:', refreshErr);
        }
      })();
      
      // Close the drawer
      const closeButton = document.querySelector('[data-drawer-close]') as HTMLButtonElement;
      if (closeButton) {
        closeButton.click();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      let errorMessage = 'Failed to update user';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button 
          variant="link" 
          className="text-foreground w-fit px-0 text-left"
          data-user-id={item.id}
        >
          {item.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle data-user-id={item.id}>{item.name}</DrawerTitle>
          <DrawerDescription>
            User details and information
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                {chartData.length > 0 ? (
                  <AreaChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                      left: 0,
                      right: 10,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.slice(0, 3)}
                      hide
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Area
                      dataKey="mobile"
                      type="natural"
                      fill="var(--color-mobile)"
                      fillOpacity={0.6}
                      stroke="var(--color-mobile)"
                      stackId="a"
                    />
                    <Area
                      dataKey="desktop"
                      type="natural"
                      fill="var(--color-desktop)"
                      fillOpacity={0.4}
                      stroke="var(--color-desktop)"
                      stackId="a"
                    />
                  </AreaChart>
                ) : (
                  <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
                    No activity data available
                  </div>
                )}
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  {!isDataLoaded ? (
                    "Loading trend data..."
                  ) : chartData.length < 2 ? (
                    "Insufficient data for trend analysis"
                  ) : trendingValue > 0 ? (
                    <>Trending up by {trendingValue}% this month <IconTrendingUp className="size-4" /></>
                  ) : trendingValue < 0 ? (
                    <>Trending down by {Math.abs(trendingValue)}% this month <IconTrendingUp className="size-4 rotate-180" /></>
                  ) : (
                    "No change in trend this month"
                  )}
                </div>
                <div className="text-muted-foreground">
                  {chartData.length > 0 ? 
                    "Showing actual user reservation activity and guest count based on historical data." :
                    "This user has no reservation history to display."
                  }
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={formValues.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={formValues.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formValues.status}
                  onValueChange={(value) => handleFormChange('status', value)}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input 
                  id="phone_number" 
                  value={formValues.phone_number}
                  onChange={(e) => handleFormChange('phone_number', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="created_at">Created At</Label>
                <Input 
                  id="created_at" 
                  defaultValue={new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }).format(new Date(item.created_at))}
                  readOnly 
                />
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
          <DrawerClose data-drawer-close asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
