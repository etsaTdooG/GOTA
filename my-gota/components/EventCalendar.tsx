'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, addDays, startOfWeek, isSameWeek } from 'date-fns';
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

// Status colors
const STATUS_COLORS = {
  confirmed: { bg: 'bg-green-200', border: 'border-green-400', badge: 'default', textColor: 'text-green-800' },
  pending: { bg: 'bg-orange-200', border: 'border-orange-400', badge: 'secondary', textColor: 'text-orange-800' },
  arrived: { bg: 'bg-blue-200', border: 'border-blue-400', badge: 'default', textColor: 'text-blue-800' },
  cancelled: { bg: 'bg-red-200', border: 'border-red-400', badge: 'destructive', textColor: 'text-red-800' },
  waiting: { bg: 'bg-yellow-200', border: 'border-yellow-400', badge: 'outline', textColor: 'text-yellow-800' },
  completed: { bg: 'bg-lime-200', border: 'border-lime-400', badge: 'outline', textColor: 'text-lime-800' },
  deposited: { bg: 'bg-sky-200', border: 'border-sky-400', badge: 'outline', textColor: 'text-sky-800' },
  default: { bg: 'bg-muted', border: 'border-muted-foreground', badge: 'outline', textColor: 'text-muted-foreground' },
};

// Helper functions
const formatHour = (hour: number) => (hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`);

function groupOverlappingEvents(events: EventData[]): EventData[][] {
  if (!events.length) return [];
  const sortedEvents = [...events].sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
  const groups: EventData[][] = [];
  sortedEvents.forEach(event => {
    const existingGroupIndex = groups.findIndex(group =>
      group.every(ge => event.startDateTime >= ge.endDateTime || event.endDateTime <= ge.startDateTime)
    );
    if (existingGroupIndex !== -1) groups[existingGroupIndex].push(event);
    else groups.push([event]);
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
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: restaurantsData, error: errorRestaurants } = await supabase.from('restaurants').select('*');
        if (errorRestaurants) throw errorRestaurants;
        if (restaurantsData) setRestaurants(restaurantsData);

        const { data: reservationsData, error: errorReservations } = await supabase.from('reservations').select('*');
        if (errorReservations) throw errorReservations;
        if (reservationsData) setReservations(reservationsData);

        const { data: usersData, error: errorUsers } = await supabase.from('users').select('*');
        if (errorUsers) throw errorUsers;
        if (usersData) setUsers(usersData);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  // Dynamic hours based on selected restaurant
  const selectedRestaurant = useMemo(
    () => (selectedValue !== 'all' ? restaurants.find(r => String(r.id) === selectedValue) : null),
    [selectedValue, restaurants]
  );

  const HOURS = useMemo(() => {
    if (selectedRestaurant) {
      const startHour = parseInt(selectedRestaurant.start_time.split(':')[0]);
      const endHour = parseInt(selectedRestaurant.end_time.split(':')[0]);
      return Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
    }
    return Array.from({ length: 17 }, (_, i) => i + 6); // Default 6 AM to 10 PM
  }, [selectedRestaurant]);

  // Event filtering and formatting
  const getFilteredEvents = useCallback((restaurantFilter: string) => {
    if (!reservations.length) return [];
    const filteredReservations =
      restaurantFilter === 'all'
        ? reservations
        : reservations.filter(res => Number(res.restaurant_id) === Number(restaurantFilter));
    return filteredReservations.map(reservation => {
      const user = users.find(u => u.id === reservation.user_id);
      const restaurant = restaurants.find(r => Number(r.id) === Number(reservation.restaurant_id));
      const dateStr = reservation.reservation_date.split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const [startHour, startMinute] = reservation.start_time.split(':').map(Number);
      const [endHour, endMinute] = reservation.end_time.split(':').map(Number);
      return {
        ...reservation,
        userName: user?.name || 'Unknown',
        restaurantName: restaurant?.name || 'Unknown',
        userPhone: user?.phone_number || 'N/A',
        userEmail: user?.email || 'N/A',
        date,
        startDateTime: new Date(year, month - 1, day, startHour, startMinute),
        endDateTime: new Date(year, month - 1, day, endHour, endMinute),
      } as EventData;
    });
  }, [reservations, users, restaurants]);

  // Memoized values
  const events = useMemo(() => getFilteredEvents(selectedValue), [selectedValue, getFilteredEvents]);
  const eventsForSelectedDate = useMemo(
    () => events.filter(event => isSameDay(event.date, selectedDate)),
    [events, selectedDate]
  );
  const eventsForSelectedWeek = useMemo(
    () => events.filter(event => isSameWeek(event.date, currentWeekStart, { weekStartsOn: 1 })),
    [events, currentWeekStart]
  );
  const daysWithEvents = useMemo(() => {
    const uniqueDates = new Set(events.map(event => format(event.date, 'yyyy-MM-dd')));
    return Array.from(uniqueDates).map(dateStr => new Date(dateStr));
  }, [events]);
  const currentWeekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  // Navigation handlers
  const goToPreviousWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const goToNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
  const handleRestaurantChange = (value: string) => setSelectedValue(value);

  // Helper functions
  const getStatusStyle = (status: string) =>
    STATUS_COLORS[status.toLowerCase() as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;

  const renderStatusBadge = (status: string) => {
    const style = getStatusStyle(status);
    const badgeVariant = style.badge as "default" | "secondary" | "destructive" | "outline";
    
    // Add custom class for "arrived" status
    const className = status.toLowerCase() === 'arrived' ? 'bg-blue-500 text-white' : undefined;
    
    return <Badge variant={badgeVariant} className={className}>{status}</Badge>;
  };

  // Render event card
  const renderEventCard = (event: EventData) => {
    const style = getStatusStyle(event.status);
    return (
      <Card key={event.reservation_id} className={cn('border-l-4 hover:shadow-md transition-shadow', style.border)}>
        <CardHeader className="p-4">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate">{event.userName}</span>
            </CardTitle>
            {renderStatusBadge(event.status)}
          </div>
          <CardDescription className="flex flex-wrap gap-2 text-sm">
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
        <CardContent className="p-4 pt-0">
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
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

      {/* Tabs */}
      <Tabs value={activeView} onValueChange={value => setActiveView(value as 'month' | 'week' | 'day')}>
        <TabsList className="grid w-full md:w-auto grid-cols-3 mb-4">
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
        </TabsList>

        {/* Month View */}
        <TabsContent value="month">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="w-full">
              <CardHeader className="p-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 shrink-0" />
                  Calendar
                </CardTitle>
                <CardDescription className="text-sm">Select a date to view reservations</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={date => date && setSelectedDate(date)}
                  modifiers={{ hasEvent: daysWithEvents }}
                  modifiersStyles={{
                    hasEvent: { fontWeight: 'bold', backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' },
                  }}
                  className="rounded-md w-full"
                />
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader className="p-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 shrink-0" />
                  Reservations {eventsForSelectedDate.length > 0 && `(${eventsForSelectedDate.length})`}
                </CardTitle>
                <CardDescription className="text-sm flex items-center gap-1">
                  <Clock className="h-4 w-4 shrink-0" />
                  {format(selectedDate, isMobile ? 'PP' : 'PPPP')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {eventsForSelectedDate.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">{eventsForSelectedDate.map(renderEventCard)}</div>
                  </ScrollArea>
                ) : (
                  <div className="py-16 text-center text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No reservations for this date</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week">
          <Card>
            <CardHeader className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
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
              <CardDescription className="text-sm flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 shrink-0" />
                {eventsForSelectedWeek.length} reservations this week
              </CardDescription>
              <Separator className="mt-4" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b">
                {currentWeekDays.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-2 text-center border-r last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors',
                      isSameDay(day, new Date()) && 'bg-muted font-bold',
                      isSameDay(day, selectedDate) && 'bg-primary/10'
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-xs uppercase text-muted-foreground">{format(day, 'EEE')}</div>
                    <div className="text-sm font-medium">{format(day, 'd')}</div>
                  </div>
                ))}
              </div>
              <div className="relative h-[calc(100vh-200px)]">
                <ScrollArea className="h-full">
                  <div className="relative min-h-full">
                    <div className="sticky left-0 w-[60px] h-full border-r bg-background z-10 float-left">
                      {HOURS.map(hour => (
                        <div key={hour} className="h-20 border-b relative">
                          <span className="absolute -top-2.5 left-2 text-xs text-muted-foreground whitespace-nowrap">
                            {formatHour(hour)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className={cn('ml-[60px]', isMobile && 'overflow-x-auto')}>
                      <div className="grid grid-cols-7 bg-muted/5" style={isMobile ? { minWidth: '700px' } : {}}>
                        {currentWeekDays.map((day, dayIndex) => {
                          const startHourOffset = selectedRestaurant
                            ? parseInt(selectedRestaurant.start_time.split(':')[0])
                            : 6;
                          return (
                            <div
                              key={dayIndex}
                              className={cn('relative border-r last:border-r-0', isSameDay(day, new Date()) && 'bg-muted/20')}
                              onClick={() => setSelectedDate(day)}
                            >
                              {HOURS.map(hour => (
                                <div key={hour} className="h-20 border-b relative" />
                              ))}
                              <TooltipProvider delayDuration={isMobile ? 0 : 300}>
                                {(() => {
                                  const eventsForDay = eventsForSelectedWeek.filter(event => isSameDay(event.date, day));
                                  const groupedEvents = groupOverlappingEvents(eventsForDay);
                                  const hourHeight = 80;
                                  return groupedEvents
                                    .map(group =>
                                      group.map((event, indexInGroup) => {
                                        const startHour = event.startDateTime.getHours();
                                        const startMinute = event.startDateTime.getMinutes();
                                        const endHour = event.endDateTime.getHours();
                                        const endMinute = event.endDateTime.getMinutes();
                                        const top = (startHour - startHourOffset) * hourHeight + (startMinute / 60) * hourHeight;
                                        const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * hourHeight;
                                        const style = getStatusStyle(event.status);
                                        const groupSize = group.length;
                                        const width = `calc((100% - 8px) / ${groupSize})`;
                                        const leftOffset = `calc(4px + (${indexInGroup} * (100% - 8px) / ${groupSize}))`;
                                        return (
                                          <Tooltip key={event.reservation_id}>
                                            <TooltipTrigger asChild>
                                              <div
                                                className={cn(
                                                  'absolute rounded-md overflow-hidden cursor-pointer px-2 py-1',
                                                  style.bg,
                                                  style.textColor,
                                                  `border ${style.border}`
                                                )}
                                                style={{
                                                  top: `${top}px`,
                                                  height: `${Math.max(height, 30)}px`,
                                                  width,
                                                  transform: `translateX(${leftOffset})`,
                                                  zIndex: 10,
                                                }}
                                              >
                                                <div className="font-medium truncate text-xs sm:text-sm">{event.userName}</div>
                                                {height >= 30 && (
                                                  <div className="truncate text-[10px] sm:text-xs">
                                                    T{event.table_id} • {event.guest_count} p
                                                  </div>
                                                )}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side={isMobile ? 'bottom' : 'right'} sideOffset={5}>
                                              <div className="font-medium">{event.userName}</div>
                                              <div className="text-xs">{format(event.date, 'PP')}</div>
                                              <div className="text-xs">
                                                {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                                              </div>
                                              <div className="text-xs">
                                                {event.restaurantName} • Table {event.table_id}
                                              </div>
                                              <div className="text-xs">
                                                {event.guest_count} guests • {event.status}
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      })
                                    )
                                    .flat();
                                })()}
                              </TooltipProvider>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
              <div className="p-4 border-t">
                <div className="flex flex-wrap gap-3 justify-center">
                  {Object.entries(STATUS_COLORS)
                    .filter(([status]) => status !== 'default')
                    .map(([status, style]) => (
                      <div key={status} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm ${style.bg} border ${style.border}`} />
                        <span className="text-xs capitalize">{status}</span>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Day View */}
        <TabsContent value="day">
          <Card>
            <CardHeader className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
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
              <CardDescription className="text-sm flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 shrink-0" />
                {eventsForSelectedDate.length} reservations
              </CardDescription>
              <Separator className="mt-4" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-[calc(100vh-200px)]">
                <ScrollArea className="h-full">
                  <div className="relative min-h-full">
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
                          <div key={hour} className="h-20 border-b relative" />
                        ))}
                        {eventsForSelectedDate.length > 0 ? (
                          eventsForSelectedDate.map(event => {
                            const startHour = event.startDateTime.getHours();
                            const startMinute = event.startDateTime.getMinutes();
                            const endHour = event.endDateTime.getHours();
                            const endMinute = event.endDateTime.getMinutes();
                            const startHourOffset = selectedRestaurant
                              ? parseInt(selectedRestaurant.start_time.split(':')[0])
                              : 6;
                            const hourHeight = 80;
                            const top = (startHour - startHourOffset) * hourHeight + (startMinute / 60) * hourHeight;
                            const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * hourHeight;
                            const style = getStatusStyle(event.status);
                            return (
                              <div
                                key={event.reservation_id}
                                className={cn(
                                  'absolute rounded-md text-sm px-3 py-2',
                                  style.bg,
                                  style.textColor,
                                  `border ${style.border}`
                                )}
                                style={{
                                  top: `${top}px`,
                                  height: `${Math.max(height, 40)}px`,
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
              <div className="p-4 border-t">
                <div className="flex flex-wrap gap-3 justify-center">
                  {Object.entries(STATUS_COLORS)
                    .filter(([status]) => status !== 'default')
                    .map(([status, style]) => (
                      <div key={status} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm ${style.bg} border ${style.border}`} />
                        <span className="text-xs capitalize">{status}</span>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}