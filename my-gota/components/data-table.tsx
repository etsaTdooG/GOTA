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

export const schema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  phone_number: z.string(),
  created_at: z.string(),
  status: z.string(),
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
    header: "Name",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="max-w-[180px] min-w-[120px] sm:w-auto">
        <Badge 
          variant="outline" 
          className="text-muted-foreground px-1.5 w-full text-left"
          title={row.original.email}
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
    header: "Status",
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
        <Badge variant={badgeVariant} className={badgeClass}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "phone_number",
    header: "Phone Number",
    cell: ({ row }) => (
      <div className="max-w-[120px] overflow-hidden whitespace-nowrap">
        <Badge variant="outline" className="text-muted-foreground px-1.5 overflow-hidden text-ellipsis">
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 shrink-0 mr-1" />
          <span className="truncate">{row.original.phone_number}</span>
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "created_at",
    header: () => <div className="text-right">Created At</div>,
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
}: {
  data: z.infer<typeof schema>[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
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

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
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
  function deleteSelectedRows() {
    const selectedRowIds = Object.keys(rowSelection);
    const newData = data.filter(row => !selectedRowIds.includes(row.id));
    setData(newData);
    setRowSelection({});
    toast.success(`${selectedRowIds.length} user(s) deleted successfully`);
  }

  const hasSelectedRows = Object.keys(rowSelection).length > 0;

  return (
    <Tabs
      defaultValue="users-table"
      className="w-full flex-col justify-start gap-6"
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
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
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
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
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
      const reservationsData = await import("@/app/dashboard/data.json").then(module => module.default);
      
      console.log(`User ${item.name} (${item.id}) - Loading data...`);
      
      // Get reservations for this user
      const userReservations = reservationsData.reservations.filter(
        (res) => res.user_id === item.id
      );
  
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

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
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
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={item.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="email">Email</Label>
                <Select defaultValue={item.email}>
                  <SelectTrigger id="email" className="w-full">
                    <SelectValue placeholder="Select an email" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={item.email}>{item.email}</SelectItem>
                    <SelectItem value="alternate@example.com">alternate@example.com</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={item.status}>
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
                <Input id="phone_number" defaultValue={item.phone_number} />
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
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
