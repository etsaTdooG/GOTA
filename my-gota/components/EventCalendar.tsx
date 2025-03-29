// EventCalendar.tsx
'use client';
import { ScheduleXCalendar, useNextCalendarApp } from "@schedule-x/react";
import { createViewDay, createViewMonthAgenda, createViewMonthGrid, createViewWeek } from "@schedule-x/calendar";
import '@schedule-x/theme-shadcn/dist/index.css';
import { useMemo, useState, useRef, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import type { Restaurant, Reservation } from "@/lib/supabase/database";
import { getRestaurants, getReservations, getUserById, getRestaurantById } from "@/lib/supabase/database";

// Event data type with additional properties
interface EventData extends Reservation {
  userName: string;
  restaurantName: string;
  userPhone: string;
  userEmail: string;
}

// Type for calendar events
interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  start: string;
  end: string;
  calendarId: string;
  location: string;
  data: EventData;
}

export default function EventCalendar() {
  // State to control component rendering
  const [calendarKey, setCalendarKey] = useState(0);
  const [selectedValue, setSelectedValue] = useState<string>("all");
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // State for data
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch restaurants on mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const restaurantsData = await getRestaurants();
        setRestaurants(restaurantsData || []);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      }
    };
    
    fetchRestaurants();
  }, []);
  
  // Fetch reservations whenever selectedValue changes
  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true);
      try {
        // Get reservations based on filter
        const filters = selectedValue !== "all" 
          ? { restaurantId: parseInt(selectedValue, 10) }
          : undefined;
        
        const reservationsData = await getReservations(filters);
        
        // Transform reservations to calendar events
        const transformedEvents = await Promise.all(
          (reservationsData || []).map(async (reservation) => {
            // Fetch user and restaurant for each reservation
            const [user, restaurant] = await Promise.all([
              getUserById(reservation.user_id),
              getRestaurantById(reservation.restaurant_id)
            ]);
            
            const userName = user ? user.name : 'Unknown';
            const restaurantName = restaurant ? restaurant.name : 'Unknown Restaurant';
            
            return {
              id: reservation.reservation_id,
              title: `${userName}`,
              description: `Guests: ${reservation.guest_count} - ${reservation.status}`,
              start: `${reservation.reservation_date} ${reservation.start_time.slice(0, 5)}`,
              end: `${reservation.reservation_date} ${reservation.end_time.slice(0, 5)}`,
              calendarId: 'reservations',
              location: `${restaurantName} - Table ${reservation.table_id}`,
              data: {
                ...reservation,
                userName,
                restaurantName,
                userPhone: user?.phone_number || 'N/A',
                userEmail: user?.email || 'N/A'
              } as EventData
            };
          })
        );
        
        setEvents(transformedEvents);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReservations();
  }, [selectedValue]);
  
  // Function to get day boundaries for selected restaurant
  const getDayBoundaries = (restaurantFilter: string) => {
    if (restaurantFilter === "all") {
      return { start: "07:00", end: "22:00" }; // Default range
    }
    
    const restaurantId = parseInt(restaurantFilter, 10);
    const restaurant = restaurants.find(r => r.id === restaurantId);
    
    if (!restaurant) {
      return { start: "07:00", end: "22:00" };
    }
    
    return {
      start: restaurant.start_time.slice(0, 5),
      end: restaurant.end_time.slice(0, 5),
    };
  };
  
  // Get time boundaries for current selection
  const currentDayBoundaries = useMemo(() => {
    return getDayBoundaries(selectedValue);
  }, [selectedValue, restaurants, getDayBoundaries]);
  
  // Create the calendar app configuration
  const calendarApp = useNextCalendarApp({
    views: [
      createViewWeek(),
      createViewDay(),
      createViewMonthAgenda(),
      createViewMonthGrid(),
    ],
    theme: 'shadcn',
    calendars: {
      reservations: {
        label: 'Reservations',
        colorName: 'reservations',
        lightColors: {
          main: 'hsl(210 40% 93.1%)',
          container: '#000',
          onContainer: 'hsl(210 40% 93.1%)',
        },
      },
    },
    selectedDate: new Date().toISOString().split('T')[0], // Today's date
    events: events,
    dayBoundaries: currentDayBoundaries,
    callbacks: {
      onEventClick: (event) => {
        // Show a popover with reservation details when an event is clicked
        const targetElement = document.querySelector(`[data-event-id="${event.id}"]`);
        if (!targetElement) return; // Add early return if element not found
        
        const eventData = event.data as EventData;
        
        const popover = document.createElement('div');
        popover.className = 'event-popover';
        popover.style.position = 'absolute';
        popover.style.zIndex = '1000';
        popover.style.backgroundColor = 'white';
        popover.style.border = '1px solid #e2e8f0';
        popover.style.borderRadius = '0.375rem';
        popover.style.padding = '1rem';
        popover.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        popover.style.width = '320px';
        
        // Get position of event
        const rect = targetElement.getBoundingClientRect();
        const calendarRect = calendarRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
        
        popover.style.left = `${rect.right - calendarRect.left + 10}px`;
        popover.style.top = `${rect.top - calendarRect.top}px`;
        
        // Create popover content
        const content = document.createElement('div');
        content.className = 'space-y-3';
        
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between';
        
        const title = document.createElement('h4');
        title.className = 'font-medium text-sm';
        title.textContent = event.title || '';
        
        const badge = document.createElement('span');
        badge.className = `inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
          eventData.status === 'Confirmed' ? 'bg-primary text-primary-foreground' :
          eventData.status === 'Pending' ? 'bg-secondary text-secondary-foreground' :
          'border-transparent text-foreground'
        }`;
        badge.textContent = eventData.status;
        
        header.appendChild(title);
        header.appendChild(badge);
        content.appendChild(header);
        
        // Add details
        const details = document.createElement('div');
        details.className = 'grid gap-1.5 text-sm';
        
        const detailItems = [
          { label: 'Restaurant', value: eventData.restaurantName },
          { label: 'Table', value: String(eventData.table_id) },
          { label: 'Guests', value: String(eventData.guest_count) },
          { label: 'Date', value: eventData.reservation_date },
          { label: 'Time', value: `${eventData.start_time.slice(0, 5)} - ${eventData.end_time.slice(0, 5)}` },
          { label: 'Contact', value: eventData.userPhone },
          { label: 'Email', value: eventData.userEmail }
        ];
        
        detailItems.forEach(item => {
          const row = document.createElement('div');
          row.className = 'flex justify-between';
          
          const label = document.createElement('span');
          label.className = 'text-muted-foreground';
          label.textContent = item.label + ':';
          
          const value = document.createElement('span');
          value.textContent = item.value;
          
          row.appendChild(label);
          row.appendChild(value);
          details.appendChild(row);
        });
        
        // Add notes if present
        if (eventData.notes !== null && eventData.notes !== undefined) {
          const notesContainer = document.createElement('div');
          notesContainer.className = 'border-t pt-2 mt-2';
          
          const notesLabel = document.createElement('span');
          notesLabel.className = 'text-muted-foreground';
          notesLabel.textContent = 'Notes:';
          
          const notes = document.createElement('p');
          notes.className = 'mt-1';
          notes.textContent = eventData.notes!;
          
          notesContainer.appendChild(notesLabel);
          notesContainer.appendChild(notes);
          details.appendChild(notesContainer);
        }
        
        content.appendChild(details);
        popover.appendChild(content);
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '0.5rem';
        closeButton.style.right = '0.5rem';
        closeButton.style.fontSize = '1.25rem';
        closeButton.style.lineHeight = '1';
        closeButton.style.cursor = 'pointer';
        closeButton.style.border = 'none';
        closeButton.style.background = 'transparent';
        closeButton.onclick = () => {
          document.body.removeEventListener('click', handleClickOutside);
          calendarRef.current?.removeChild(popover);
        };
        popover.appendChild(closeButton);
        
        // Add click outside handler
        const handleClickOutside = (e: MouseEvent) => {
          if (!popover.contains(e.target as Node)) {
            document.body.removeEventListener('click', handleClickOutside);
            if (calendarRef.current?.contains(popover)) {
              calendarRef.current.removeChild(popover);
            }
          }
        };
        
        // Delay adding the click handler to prevent immediate triggering
        setTimeout(() => {
          document.body.addEventListener('click', handleClickOutside);
        }, 100);
        
        // Append popover to the calendar container
        calendarRef.current?.appendChild(popover);
      },
    },
  });
  
  const handleRestaurantChange = (value: string) => {
    setSelectedValue(value);
    setCalendarKey(prev => prev + 1); // Force re-render
  };
  
  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reservation Calendar</h2>
        <Select value={selectedValue} onValueChange={handleRestaurantChange}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select restaurant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Restaurants</SelectItem>
            {restaurants.map(restaurant => (
              <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                {restaurant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="calendar-container h-[600px] border rounded-lg p-2" ref={calendarRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScheduleXCalendar key={calendarKey} calendarApp={calendarApp} />
        )}
      </div>
    </div>
  );
}