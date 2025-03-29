import { DataTable } from "@/components/data-table"
import data from "../data.json"

export default function Page() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Users</h1>
        <p className="text-muted-foreground mb-6">Manage user accounts and permissions</p>
      </div>
      <DataTable data={data.users} />
    </div>
  )
}
