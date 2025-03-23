"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, PlusIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Dữ liệu mẫu cho lịch đặt bàn
const timeSlots = [
  "9:00 - 9:30",
  "9:30 - 10:00",
  "10:00 - 10:30",
  "10:30 - 11:00",
  "11:00 - 11:30",
  "11:30 - 12:00",
  "12:00 - 12:30",
];

const reservations = [
  { 
    id: 1, 
    name: "Alice", 
    time: "9:00 - 9:30", 
    people: 2, 
    status: "finished" 
  },
  { 
    id: 2, 
    name: "Bella", 
    time: "9:30 - 10:00", 
    people: 4, 
    status: "cancelled" 
  },
  { 
    id: 3, 
    name: "David", 
    time: "9:00 - 9:30", 
    people: 3, 
    status: "waitingPayment" 
  },
  { 
    id: 4, 
    name: "Anna", 
    time: "10:00 - 10:30", 
    people: 2, 
    status: "waitingPayment" 
  },
  { 
    id: 5, 
    name: "Corbin", 
    time: "10:30 - 11:00", 
    people: 2, 
    status: "pending" 
  },
  { 
    id: 6, 
    name: "Mary", 
    time: "10:00 - 10:30", 
    people: 3, 
    status: "cancelled" 
  },
  { 
    id: 7, 
    name: "Clinton", 
    time: "10:00 - 10:30", 
    people: 5, 
    status: "waitingPayment" 
  },
  { 
    id: 8, 
    name: "Elias", 
    time: "11:00 - 11:30", 
    people: 3, 
    status: "deposited" 
  },
  { 
    id: 9, 
    name: "Rory", 
    time: "11:30 - 12:00", 
    people: 2, 
    status: "pending" 
  },
  { 
    id: 10, 
    name: "Zane", 
    time: "11:30 - 12:00", 
    people: 2, 
    status: "pending" 
  },
  { 
    id: 11, 
    name: "Dominic", 
    time: "11:30 - 12:00", 
    people: 1, 
    status: "pending" 
  },
  { 
    id: 12, 
    name: "Elsa", 
    time: "11:30 - 12:00", 
    people: 2, 
    status: "waitingPayment" 
  },
  { 
    id: 13, 
    name: "Edsel", 
    time: "12:00 - 12:30", 
    people: 4, 
    status: "deposited" 
  },
  { 
    id: 14, 
    name: "Elmer", 
    time: "12:00 - 12:30", 
    people: 3, 
    status: "deposited" 
  },
];

// Function để lấy màu background dựa trên trạng thái
const getStatusBgColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
    case "deposited":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300";
    case "waitingPayment":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    case "finished":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
};

export default function Dashboard() {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <div className="h-full flex flex-col">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">RESERVATION SCHEDULE</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search everything"
                className="pl-10 pr-4 py-2 rounded-md border border-input bg-background h-10 w-64"
              />
            </div>
            <Button variant="outline" size="icon">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback>KN</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex-1 p-8">
        <div className="flex gap-6 items-start">
          <Card className="w-72">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Chọn ngày</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="rounded-md border"
              />
              <div className="flex justify-center mt-4">
                <Button variant="outline" className="w-full flex gap-2 items-center">
                  <CalendarIcon className="h-4 w-4" />
                  {format(date, "EEE dd/MM")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <Card className="w-auto">
                <CardContent className="p-4 flex items-center gap-2">
                  <div className="text-4xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">
                    <div>Available seat</div>
                    <div className="flex items-center">
                      <svg
                        className="h-4 w-4 text-muted-foreground"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2a8 8 0 100 16 8 8 0 000-16zm0 11a1 1 0 110 2 1 1 0 010-2zm0-9a3 3 0 013 3c0 1.5-2 2.5-2 4a1 1 0 01-2 0c0-2.5 2-2.5 2-4a1 1 0 00-1-1 1 1 0 00-1 1 1 1 0 01-2 0 3 3 0 013-3z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button className="bg-blue-500 hover:bg-blue-600 text-white flex gap-2 items-center">
                <PlusIcon className="h-4 w-4" />
                CREATE
              </Button>
            </div>

            <div className="overflow-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot}
                      className="text-center py-2 bg-muted text-sm font-medium rounded-md"
                    >
                      {slot}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {timeSlots.map((timeSlot) => {
                    const slotReservations = reservations.filter(
                      (res) => res.time === timeSlot
                    );

                    return (
                      <div
                        key={timeSlot}
                        className={cn(
                          "flex flex-col gap-1 min-h-[140px]",
                          slotReservations.length === 0 && "bg-gray-50 dark:bg-gray-900/20 rounded-md"
                        )}
                      >
                        {slotReservations.map((reservation) => (
                          <div
                            key={reservation.id}
                            className={cn(
                              "p-2 rounded-md",
                              getStatusBgColor(reservation.status)
                            )}
                          >
                            <div className="font-medium">{reservation.name}</div>
                            <div className="text-xs">
                              People: {reservation.people}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-400"></div>
                <span className="text-sm">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-cyan-400"></div>
                <span className="text-sm">Deposited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                <span className="text-sm">Waiting payment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-400"></div>
                <span className="text-sm">Finished</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-400"></div>
                <span className="text-sm">Cancelled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 