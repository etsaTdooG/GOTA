import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { z } from "zod"
import reservationData from "../data.json"

// Define the reservation schema
const reservationSchema = z.object({
  reservation_id: z.number(),
  user_id: z.string(),
  guest_count: z.number(),
  created_at: z.string(),
  restaurant_id: z.number().optional(),
  table_id: z.number().optional(),
  reservation_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().nullable().optional(),
})

export type Reservation = z.infer<typeof reservationSchema>

// Component to display reservation data
function ReservationTable({ data }: { data: Reservation[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">User ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Guest Count</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Created At</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((reservation) => (
              <tr key={reservation.reservation_id} className="border-t">
                <td className="px-4 py-3 text-sm">{reservation.reservation_id}</td>
                <td className="px-4 py-3 text-sm">{reservation.user_id}</td>
                <td className="px-4 py-3 text-sm">{reservation.guest_count}</td>
                <td className="px-4 py-3 text-sm">
                  {new Date(reservation.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm">{reservation.status || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ReservationsPage() {
  // Parse the reservations array from the JSON data
  const reservations = z.array(reservationSchema).parse(reservationData.reservations)

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
                <p className="text-muted-foreground mt-2">
                  View all reservations in the system.
                </p>
              </div>
              <div className="px-4 lg:px-6">
                <ReservationTable data={reservations} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 