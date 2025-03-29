"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useTimeRange } from "@/components/time-range-context"

import data from "@/app/dashboard/data.json"

export const description = "An interactive area chart"

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  reservation: {
    label: "Reservations",
    color: "var(--primary)",
  },
  guests: {
    label: "Guests",
    color: "var(--primary)",
  },
  total: {
    label: "Total",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const { timeRange, setTimeRange, getTimeRangeText } = useTimeRange()
  const [activeUsers, setActiveUsers] = React.useState(0)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile, setTimeRange])

  // Process the data for chart
  const processedData = React.useMemo(() => {
    // Group reservations by date
    const reservationsByDate = data.reservations.reduce((acc, reservation) => {
      const date = reservation.created_at;
      if (!acc[date]) {
        acc[date] = {
          date,
          reservationCount: 0,
          guestCount: 0,
          users: new Set()
        };
      }
      acc[date].reservationCount += 1;
      acc[date].guestCount += reservation.guest_count;
      acc[date].users.add(reservation.user_id);
      return acc;
    }, {} as Record<string, { date: string; reservationCount: number; guestCount: number; users: Set<string> }>);

    // Convert to array and sort by date
    return Object.values(reservationsByDate)
      .map(item => ({
        date: item.date,
        reservation: item.reservationCount,
        guests: item.guestCount,
        users: Array.from(item.users)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    return processedData.filter((item) => {
      const date = new Date(item.date)
      // Use a fixed reference date from the data
      const referenceDate = new Date('2025-03-29T00:00:00Z')
      let daysToSubtract = 90
      if (timeRange === "30d") {
        daysToSubtract = 30
      } else if (timeRange === "7d") {
        daysToSubtract = 7
      }
      const startDate = new Date(referenceDate)
      startDate.setDate(startDate.getDate() - daysToSubtract)
      return date >= startDate
    });
  }, [processedData, timeRange]);

  React.useEffect(() => {
    // Count unique users in the filtered data
    const uniqueUsers = new Set()
    filteredData.forEach(item => {
      item.users.forEach(userId => {
        uniqueUsers.add(userId)
      })
    })
    setActiveUsers(uniqueUsers.size)
  }, [filteredData])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Visitors</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {`${getTimeRangeText()} (${activeUsers} active users)`}
          </span>
          <span className="@[540px]/card:hidden">{getTimeRangeText()}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillReservation" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-reservation)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-reservation)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillGuests" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-guests)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-guests)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="guests"
              type="natural"
              fill="url(#fillGuests)"
              stroke="var(--color-guests)"
              stackId="a"
            />
            <Area
              dataKey="reservation"
              type="natural"
              fill="url(#fillReservation)"
              stroke="var(--color-reservation)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
