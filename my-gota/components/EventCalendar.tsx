'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO, addDays, startOfWeek, isSameWeek, getDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, User, Calendar as CalendarIcon, Clock, Users, Info, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
interface Reservation {
  reservation_id: number;
  user_id: string;
  restaurant_id: number | string;
  table_id: number;
  guest_count: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  status: string;
  notes: string | null;
}

interface Restaurant {
  id: number | string;
  name: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  name: string;
  email?: string;
  phone_number?: string;
}

interface EventData extends Reservation {
  userName: string;
  restaurantName: string;
  userPhone: string;
  userEmail: string;
  date: Date;
  startDateTime: Date;
  endDateTime: Date;
}

// Constants
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
const STATUS_COLORS = {
  confirmed: {
    bg: 'bg-green-200',
    border: 'border-green-400',
    badge: 'default',
    textColor: 'text-green-800'
  },
  pending: {
    bg: 'bg-orange-200',
    border: 'border-orange-400',
    badge: 'secondary',
    textColor: 'text-orange-800'
  },
  arrived: {
    bg: 'bg-blue-200',
    border: 'border-blue-400',
    badge: 'success',
    textColor: 'text-blue-800'
  },
  cancelled: {
    bg: 'bg-red-200',
    border: 'border-red-400',
    badge: 'destructive',
    textColor: 'text-red-800'
  },
  waiting: { 
    bg: 'bg-yellow-200',
    border: 'border-yellow-400',
    badge: 'outline',
    textColor: 'text-yellow-800'
  },
  completed: {
    bg: 'bg-lime-200',
    border: 'border-lime-400',
    badge: 'outline',
    textColor: 'text-lime-800'
  },
  deposited: {
    bg: 'bg-sky-200',
    border: 'border-sky-400',
    badge: 'outline',
    textColor: 'text-sky-800'
  },
  default: {
    bg: 'bg-muted',
    border: 'border-muted-foreground',
    badge: 'outline',
    textColor: 'text-muted-foreground'
  }
};

// Format time to AM/PM
const formatHour = (hour: number) => {
  if (hour === 12) return '12 PM';
  return hour > 12 ? `${hour-12} PM` : `${hour} AM`;
};

function groupOverlappingEvents(events: EventData[]): EventData[][] {
  if (!events.length) return [];
  
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    a.startDateTime.getTime() - b.startDateTime.getTime()
  );
  
  const groups: EventData[][] = [];
  let currentGroup: EventData[] = [];
  
  sortedEvents.forEach(event => {
    // Find existing group where this event doesn't overlap with any event
    const existingGroupIndex = groups.findIndex(group => 
      group.every(groupEvent => 
        event.startDateTime >= groupEvent.endDateTime || 
        event.endDateTime <= groupEvent.startDateTime
      )
    );
    
    if (existingGroupIndex !== -1) {
      // Add to existing non-overlapping group
      groups[existingGroupIndex].push(event);
    } else {
      // Create a new group
      groups.push([event]);
    }
  });
  
  return groups;
}

export default function EventCalendar() {
  // State
  const [selectedValue, setSelectedValue] = useState<string>('all');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect mobile screens
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch restaurants
        const { data: restaurantsData, error: errorRestaurants } = await supabase
          .from('restaurants')
          .select('*');
        
        if (errorRestaurants) throw errorRestaurants;
        if (restaurantsData) setRestaurants(restaurantsData);

        // Fetch reservations
        const { data: reservationsData, error: errorReservations } = await supabase
          .from('reservations')
          .select('*');
        
        if (errorReservations) throw errorReservations;
        if (reservationsData) setReservations(reservationsData);

        // Fetch users
        const { data: usersData, error: errorUsers } = await supabase
          .from('users')
          .select('*');
        
        if (errorUsers) throw errorUsers;
        if (usersData) setUsers(usersData);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  // Filter events by restaurant and format data
  const getFilteredEvents = (restaurantFilter: string) => {
    if (!reservations.length) return [];
    
    const filteredReservations = restaurantFilter === 'all'
      ? reservations
      : reservations.filter(res => Number(res.restaurant_id) === Number(restaurantFilter));

    return filteredReservations.map(reservation => {
      const user = users.find(u => u.id === reservation.user_id);
      const restaurant = restaurants.find(r => Number(r.id) === Number(reservation.restaurant_id));
      
      // Format date
      let dateStr = reservation.reservation_date;
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      }
      
      // Create Date objects
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      const [startHour, startMinute] = reservation.start_time.split(':').map(Number);
      const [endHour, endMinute] = reservation.end_time.split(':').map(Number);
      
      const startDateTime = new Date(year, month - 1, day, startHour, startMinute);
      const endDateTime = new Date(year, month - 1, day, endHour, endMinute);
      
      return {
        ...reservation,
        userName: user?.name || 'Unknown',
        restaurantName: restaurant?.name || 'Unknown',
        userPhone: user?.phone_number || 'N/A',
        userEmail: user?.email || 'N/A',
        date,
        startDateTime,
        endDateTime
      } as EventData;
    });
  };

  // Memoized values
  const events = useMemo(() => getFilteredEvents(selectedValue), [selectedValue, reservations, users, restaurants]);
  
  const eventsForSelectedDate = useMemo(() => 
    events.filter(event => isSameDay(event.date, selectedDate)), 
    [events, selectedDate]
  );
  
  const eventsForSelectedWeek = useMemo(() => 
    events.filter(event => isSameWeek(event.date, currentWeekStart, { weekStartsOn: 1 })), 
    [events, currentWeekStart]
  );
  
  const daysWithEvents = useMemo(() => {
    const uniqueDates = new Set<string>();
    events.forEach(event => uniqueDates.add(format(event.date, 'yyyy-MM-dd')));
    
    return Array.from(uniqueDates).map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
  }, [events]);
  
  const currentWeekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)), 
    [currentWeekStart]
  );

  // Navigation handlers
  const goToPreviousWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const goToNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
  const handleRestaurantChange = (value: string) => setSelectedValue(value);

  // Helper functions
  const getStatusStyle = (status: string) => {
    const normalizedStatus = status.toLowerCase() as keyof typeof STATUS_COLORS;
    return STATUS_COLORS[normalizedStatus] || STATUS_COLORS.default;
  };

  const renderStatusBadge = (status: string) => {
    const style = getStatusStyle(status);
    return <Badge variant={style.badge as any}>{status}</Badge>;
  };

  // Render functions
  const renderEventCard = (event: EventData) => {
    const style = getStatusStyle(event.status);
    
    return (
      <Card 
        key={event.reservation_id} 
        className={cn("border-l-4 hover:shadow-md transition-shadow", style.border)}
      >
        <CardHeader className="pb-2 px-3 md:px-6">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate">{event.userName}</span>
            </CardTitle>
            {renderStatusBadge(event.status)}
          </div>
          <CardDescription className="flex flex-wrap gap-2 md:gap-4">
            <span className="flex items-center gap-1 min-w-[100px]">
              <Clock className="h-3 w-3 shrink-0" />
              {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.restaurantName}</span>
            </span>
            <span>Table {event.table_id}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2 pt-0 px-3 md:px-6">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3 shrink-0" /> Guests:
              </span>
              <span>{event.guest_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact:</span>
              <span className="truncate max-w-[150px]">{event.userPhone}</span>
            </div>
            {event.notes && (
              <div className="mt-2 pt-2 border-t">
                <span className="text-muted-foreground flex items-center gap-1 mb-1">
                  <Info className="h-3 w-3 shrink-0" /> Notes:
                </span>
                <p className="text-sm line-clamp-3">{event.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header section with filters and navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-auto">
          <Select onValueChange={handleRestaurantChange} value={selectedValue}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Select Restaurant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Restaurants</SelectItem>
              {restaurants.map(restaurant => (
                <SelectItem key={restaurant.id} value={String(restaurant.id)}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-2 min-w-[120px] text-center">
            {format(currentWeekStart, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View tabs */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'month' | 'week' | 'day')}>
        <div className="flex justify-end mb-4">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
          </TabsList>
        </div>

        {/* Month view */}
        <TabsContent value="month">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-6">
            <Card className="w-full md:col-span-1 mx-auto md:mx-0 mb-6 md:mb-0">
              <CardHeader className="px-3 md:px-6">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 shrink-0" />
                  Calendar
                </CardTitle>
                <CardDescription>Select a date to view reservations</CardDescription>
              </CardHeader>
              <CardContent className="px-2 md:px-6">
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={date => date && setSelectedDate(date)}
                    modifiers={{ hasEvent: daysWithEvents }}
                    modifiersStyles={{
                      hasEvent: { 
                        fontWeight: 'bold',
                        backgroundColor: 'hsl(var(--primary) / 0.1)',
                        color: 'hsl(var(--primary))'
                      }
                    }}
                    className="rounded-md"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="px-3 md:px-6">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 shrink-0" />
                  Reservations {eventsForSelectedDate.length > 0 && `(${eventsForSelectedDate.length})`}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-4 w-4 shrink-0" />
                  {format(selectedDate, isMobile ? 'PP' : 'PPPP')}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 md:px-6">
                {eventsForSelectedDate.length > 0 ? (
                  <ScrollArea className="h-[300px] sm:h-[400px] pr-4">
                    <div className="space-y-4">
                      {eventsForSelectedDate.map(renderEventCard)}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="py-12 md:py-16 text-center text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No reservations for this date</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Week view */}
        <TabsContent value="week">
          <Card className="overflow-hidden border">
            <CardHeader className="px-3 md:px-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 shrink-0" />
                  Week of {format(currentWeekStart, isMobile ? 'PP' : 'PPPP')}
                </CardTitle>
                <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextWeek}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
              <CardDescription className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 shrink-0" />
                {eventsForSelectedWeek.length} reservations this week
              </CardDescription>
              <Separator className="mt-4" />
            </CardHeader>
            <CardContent className="p-0">
              {/* Week header */}
              <div className="grid grid-cols-7 border-b">
                {currentWeekDays.map((day, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "p-2 text-center border-r last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors",
                      isSameDay(day, new Date()) ? "bg-muted font-bold" : "",
                      isSameDay(day, selectedDate) ? "bg-primary/10" : ""
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-xs uppercase text-muted-foreground">{format(day, 'EEE')}</div>
                    <div className="text-sm font-medium">{format(day, 'd')}</div>
                  </div>
                ))}
              </div>
              
              {/* Week timeline */}
              <div className="relative" style={{ height: isMobile ? '500px' : '600px', overflow: 'hidden' }}>
                <ScrollArea className="h-full">
                  <div className="relative min-w-[400px] min-h-full">
                    <div className="sticky left-0 w-[60px] h-full border-r bg-background z-10 float-left">
                      {HOURS.map(hour => (
                        <div key={hour} className="h-20 border-b relative">
                          <span className="absolute -top-2.5 left-2 text-xs text-muted-foreground whitespace-nowrap">
                            {formatHour(hour)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="ml-[60px] grid grid-cols-7 bg-muted/5">
                      {currentWeekDays.map((day, dayIndex) => (
                        <div 
                          key={dayIndex} 
                          className={cn(
                            "relative border-r last:border-r-0",
                            isSameDay(day, new Date()) ? "bg-muted/20" : ""
                          )}
                          onClick={() => setSelectedDate(day)}
                        >
                          {HOURS.map(hour => (
                            <div key={hour} className="h-20 border-b relative"></div>
                          ))}
                          
                          {/* Events for this day */}
                          <TooltipProvider delayDuration={isMobile ? 0 : 300}>
                            {(() => {
                              // Group events by overlapping time periods
                              const eventsForDay = eventsForSelectedWeek.filter(event => isSameDay(event.date, day));
                              const groupedEvents = groupOverlappingEvents(eventsForDay);
                              
                              return groupedEvents.map(group => 
                                group.map((event, indexInGroup) => {
                                  const startHour = event.startDateTime.getHours();
                                  const startMinute = event.startDateTime.getMinutes();
                                  const endHour = event.endDateTime.getHours();
                                  const endMinute = event.endDateTime.getMinutes();
                                  
                                  const hourHeight = 80; // Each cell is h-20 (80px in Tailwind)
                                  const top = (startHour - 6) * hourHeight + (startMinute / 60) * hourHeight;
                                  const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * hourHeight;
                                  const style = getStatusStyle(event.status);
                                  
                                  // Calculate width and left offset based on group size
                                  const groupSize = group.length;
                                  const width = `calc((100% - 8px) / ${groupSize})`;
                                  const leftOffset = `calc(4px + (${indexInGroup} * (100% - 8px) / ${groupSize}))`;
                                  
                                  return (
                                    <Tooltip key={event.reservation_id}>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={cn(
                                            "absolute rounded-md overflow-hidden cursor-pointer",
                                            isMobile ? "px-1 py-1" : "px-2 py-1",
                                            style.bg, style.textColor,
                                            `border ${style.border}`
                                          )}
                                          style={{
                                            top: `${top}px`,
                                            height: `${Math.max(height, 30)}px`,
                                            left: 'auto', // Override left
                                            right: 'auto', // Override right
                                            width: width,
                                            transform: `translateX(${leftOffset})`,
                                            zIndex: 10,
                                          }}
                                        >
                                          <div className="font-medium truncate text-[11px]">{event.userName}</div>
                                          {height >= 30 && (
                                            <div className="truncate text-[9px]">
                                              T{event.table_id} • {event.guest_count} p
                                            </div>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side={isMobile ? "bottom" : "right"} sideOffset={5}>
                                        <div className="font-medium">{event.userName}</div>
                                        <div className="text-xs">{format(event.date, 'PP')}</div>
                                        <div className="text-xs">{event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}</div>
                                        <div className="text-xs">{event.restaurantName} • Table {event.table_id}</div>
                                        <div className="text-xs">{event.guest_count} guests • {event.status}</div>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })
                              ).flat();
                            })()}
                          </TooltipProvider>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
            {/* Add legend */}
            <div className="p-4 border-t mt-2">
              <div className="flex flex-wrap gap-3 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-orange-200 border border-orange-400"></div>
                  <span className="text-xs">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-sky-200 border border-sky-400"></div>
                  <span className="text-xs">Deposited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-yellow-200 border border-yellow-400"></div>
                  <span className="text-xs">Waiting payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-green-200 border border-green-400"></div>
                  <span className="text-xs">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-200 border border-red-400"></div>
                  <span className="text-xs">Cancelled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-lime-200 border border-lime-400"></div>
                  <span className="text-xs">Completed</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Day view */}
        <TabsContent value="day">
          <Card className="overflow-hidden">
            <CardHeader className="px-3 md:px-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 shrink-0" />
                  {format(selectedDate, isMobile ? 'PP' : 'PPPP')}
                </CardTitle>
                <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(prev => addDays(prev, -1))}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(prev => addDays(prev, 1))}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
              <CardDescription className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 shrink-0" />
                {eventsForSelectedDate.length} reservations
              </CardDescription>
              <Separator className="mt-4" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative" style={{ height: isMobile ? '500px' : '600px', overflow: 'hidden' }}>
                <ScrollArea className="h-full">
                  <div className="relative min-w-[300px] min-h-full">
                    <div className="sticky left-0 w-[60px] h-full border-r bg-background z-10 float-left">
                      {HOURS.map(hour => (
                        <div key={hour} className="h-20 border-b relative">
                          <span className="absolute -top-2.5 left-2 text-xs text-muted-foreground whitespace-nowrap">
                            {formatHour(hour)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="ml-[60px]">
                      <div className="relative w-full">
                        {HOURS.map(hour => (
                          <div key={hour} className="h-20 border-b relative"></div>
                        ))}
                        
                        {/* Events for this day */}
                        {eventsForSelectedDate.length > 0 ? (
                          eventsForSelectedDate.map(event => {
                            const startHour = event.startDateTime.getHours();
                            const startMinute = event.startDateTime.getMinutes();
                            const endHour = event.endDateTime.getHours();
                            const endMinute = event.endDateTime.getMinutes();
                            
                            // Calculate position - fixed calculation to match the h-20 cell height
                            const hourHeight = 80; // Each cell is h-20 (80px in Tailwind)
                            const top = (startHour - 6) * hourHeight + (startMinute / 60) * hourHeight;
                            const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * hourHeight;
                            const style = getStatusStyle(event.status);
                            
                            return (
                              <div
                                key={event.reservation_id}
                                className={cn(
                                  "absolute rounded-md text-sm",
                                  isMobile ? "px-2 py-1" : "px-3 py-2", // Reduced padding on mobile
                                  style.bg, style.textColor,
                                  `border ${style.border}`
                                )}
                                style={{
                                  top: `${top}px`,
                                  height: `${Math.max(height, 40)}px`, // Minimum height for mobile
                                  left: '8px',
                                  right: '8px',
                                  zIndex: 10,
                                }}
                              >
                                <div className="flex justify-between items-start gap-1 flex-wrap">
                                  <div className="font-medium truncate">{event.userName}</div>
                                  <div className="shrink-0">{renderStatusBadge(event.status)}</div>
                                </div>
                                <div className="text-xs mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                                </div>
                                {height >= 60 && (
                                  <>
                                    <div className="text-xs truncate">{event.restaurantName} • Table {event.table_id}</div>
                                    <div className="text-xs flex items-center gap-1">
                                      <Users className="h-3 w-3 shrink-0" />
                                      {event.guest_count} guests
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                              <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No reservations for this day</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
            {/* Add legend */}
            <div className="p-4 border-t mt-2">
              <div className="flex flex-wrap gap-3 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-orange-200 border border-orange-400"></div>
                  <span className="text-xs">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-sky-200 border border-sky-400"></div>
                  <span className="text-xs">Deposited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-yellow-200 border border-yellow-400"></div>
                  <span className="text-xs">Waiting payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-green-200 border border-green-400"></div>
                  <span className="text-xs">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-200 border border-red-400"></div>
                  <span className="text-xs">Cancelled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-lime-200 border border-lime-400"></div>
                  <span className="text-xs">Completed</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
